import matplotlib.pyplot as plt
import seaborn as sns
import streamlit as st
from utils.logger import log_event

def create_trend_plots(df):
    numeric_cols = df.select_dtypes(include=['number']).columns
    if len(numeric_cols) >= 2:
        fig, ax = plt.subplots()
        sns.lineplot(data=df, x=numeric_cols[0], y=numeric_cols[1], ax=ax)
        st.pyplot(fig)
    log_event("Trend plots created")