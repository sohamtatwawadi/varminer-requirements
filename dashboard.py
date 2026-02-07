"""
Varminer Product Backlog Dashboard
PM-facing view: KPIs by status + filterable backlog. Data from requirements.csv.
"""
import streamlit as st
import pandas as pd
from pathlib import Path

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
STREAMDIR = Path(__file__).resolve().parent
CSV_PATH = STREAMDIR / "requirements.csv"

# JIRA-style status flow (order for KPIs and display)
STATUS_ORDER = [
    "Not started",
    "In DEV",
    "In UAT",
    "Dev completed",
    "Closed",
]
# Normalize legacy/alternate values to the above
STATUS_ALIASES = {
    "In progress": "In DEV",
    "In Progress": "In DEV",
    "To Do": "Not started",
    "Not star...": "Not started",
    "Done": "Closed",
}

# -----------------------------------------------------------------------------
# Data load
# -----------------------------------------------------------------------------
@st.cache_data(ttl=60)
def load_requirements() -> pd.DataFrame:
    if not CSV_PATH.exists():
        return pd.DataFrame()
    df = pd.read_csv(CSV_PATH)
    if df.empty:
        return df
    # Normalize status for KPIs
    col = "Status"
    if col in df.columns:
        df[col] = df[col].str.strip()
        df[col] = df[col].replace(STATUS_ALIASES).fillna("Not started")
        # Coerce to allowed set
        allowed = set(STATUS_ORDER)
        df.loc[~df[col].isin(allowed), col] = "Not started"
    return df


def main():
    st.set_page_config(
        page_title="Varminer Product Backlog",
        page_icon="📋",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    df = load_requirements()
    if df.empty:
        st.warning("No requirements found. Add rows to `requirements.csv` in this folder.")
        return

    # ----- KPIs -----
    st.title("Varminer Product Backlog")
    st.caption("Product manager view · Data from requirements.csv")

    status_col = "Status"
    counts = df[status_col].value_counts().reindex(STATUS_ORDER, fill_value=0)
    total = len(df)

    kpi_cols = st.columns([1] + [1] * len(STATUS_ORDER))
    with kpi_cols[0]:
        st.metric("Total requirements", total)
    for i, status in enumerate(STATUS_ORDER):
        with kpi_cols[i + 1]:
            n = int(counts.get(status, 0))
            st.metric(status, n)

    st.divider()

    # ----- Filters (sidebar) -----
    with st.sidebar:
        st.subheader("Filters")
        filter_status = st.multiselect(
            "Status",
            options=STATUS_ORDER,
            default=STATUS_ORDER,
            key="filter_status",
        )
        filter_priority = st.multiselect(
            "Priority",
            options=(df["Priority"].dropna().unique().tolist() if "Priority" in df.columns else []),
            default=None,
            key="filter_priority",
        )
        filter_type = st.multiselect(
            "Type",
            options=(df["Type"].dropna().unique().tolist() if "Type" in df.columns else []),
            default=None,
            key="filter_type",
        )
        filter_release = st.multiselect(
            "Release",
            options=(df["Release"].dropna().unique().tolist() if "Release" in df.columns else []),
            default=None,
            key="filter_release",
        )

    # Apply filters
    subset = df.copy()
    subset = subset[subset[status_col].isin(filter_status)]
    if filter_priority:
        subset = subset[subset["Priority"].isin(filter_priority)]
    if filter_type:
        subset = subset[subset["Type"].isin(filter_type)]
    if filter_release:
        subset = subset[subset["Release"].isin(filter_release)]

    # Sort: Priority (Critical first), then Stack rank, then ID
    if "Stack rank" in subset.columns:
        subset["Stack rank"] = pd.to_numeric(subset["Stack rank"], errors="coerce")
    if "Priority" in subset.columns:
        priority_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
        subset["_porder"] = subset["Priority"].map(priority_order).fillna(4)
        subset = subset.sort_values(["_porder", "Stack rank", "ID"], na_position="last")
        subset = subset.drop(columns=["_porder"], errors="ignore")
    else:
        subset = subset.sort_values("ID", na_position="last")

    # ----- Backlog table -----
    st.subheader("Backlog")
    display_cols = [
        "ID", "Requirement", "Type", "Priority", "Status",
        "Estimate", "Stack rank", "Target sprint", "Release",
        "Requestee dept", "Requested by", "Assignee",
    ]
    display_cols = [c for c in display_cols if c in subset.columns]
    table_df = subset[display_cols]

    st.dataframe(
        table_df,
        use_container_width=True,
        hide_index=True,
        column_config={
            "ID": st.column_config.TextColumn("ID", width="small"),
            "Requirement": st.column_config.TextColumn("Requirement", width="large"),
            "Type": st.column_config.TextColumn("Type", width="medium"),
            "Priority": st.column_config.TextColumn("Priority", width="small"),
            "Status": st.column_config.TextColumn("Status", width="small"),
            "Estimate": st.column_config.TextColumn("Estimate", width="small"),
            "Stack rank": st.column_config.NumberColumn("Stack", width="small", format="%d"),
            "Target sprint": st.column_config.TextColumn("Target sprint", width="small"),
            "Release": st.column_config.TextColumn("Release", width="small"),
            "Requestee dept": st.column_config.TextColumn("Dept", width="small"),
            "Requested by": st.column_config.TextColumn("Requested by", width="small"),
            "Assignee": st.column_config.TextColumn("Assignee", width="small"),
        },
    )

    # ----- Expandable: full row detail -----
    st.subheader("Requirement detail")
    ids = subset["ID"].tolist()
    selected_id = st.selectbox("Select requirement", options=ids, key="detail_id")
    if selected_id:
        row = subset[subset["ID"] == selected_id].iloc[0]
        with st.expander("View full fields", expanded=True):
            for col in subset.columns:
                val = row[col]
                if pd.isna(val) or val == "" or str(val).strip() == "—":
                    continue
                st.markdown(f"**{col}**")
                st.write(str(val))
                st.markdown("")

    # ----- Export -----
    st.sidebar.divider()
    csv_bytes = subset.to_csv(index=False).encode("utf-8")
    st.sidebar.download_button(
        "Export filtered backlog (CSV)",
        data=csv_bytes,
        file_name="varminer_backlog_export.csv",
        mime="text/csv",
        key="export_csv",
    )


if __name__ == "__main__":
    main()
