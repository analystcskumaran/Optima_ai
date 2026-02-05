import matplotlib.pyplot as plt
import seaborn as sns
import streamlit as st
from utils.logger import log_event

def create_basic_plots(df):
    numeric_cols = df.select_dtypes(include=['number']).columns
    for col in numeric_cols[:3]:  # Limit to first 3 for demo
        fig, ax = plt.subplots()
        sns.histplot(df[col], ax=ax)
        st.pyplot(fig)
        
        fig2, ax2 = plt.subplots()
        sns.boxplot(x=df[col], ax=ax2)
        st.pyplot(fig2)
    log_event("Basic plots created")