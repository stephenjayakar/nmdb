import json
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta

# Load and parse data
with open('../output/merged.json', 'r') as f:
    messages = json.load(f)

# Convert to DataFrame
df = pd.DataFrame(messages)
df['timestamp'] = pd.to_datetime(df['timestamp'], format='ISO8601')
df = df.sort_values('timestamp')

# Calculate response times
def calculate_response_times(df):
    response_times = []
    user_last_message = {}
    
    for idx, row in df.iterrows():
        sender = row['sender']
        timestamp = row['timestamp']
        
        for other_sender in df['sender'].unique():
            if other_sender != sender and other_sender in user_last_message:
                last_msg_time = user_last_message[other_sender]
                response_time = (timestamp - last_msg_time).total_seconds() / 60  # minutes
                
                response_times.append({
                    'responder': sender,
                    'original_sender': other_sender,
                    'response_time_min': response_time,
                    'timestamp': timestamp
                })
        
        user_last_message[sender] = timestamp
    
    return pd.DataFrame(response_times)

response_df = calculate_response_times(df)

# Create time ranges with different granularity
def create_multi_granular_df(df):
    # Create different time granularities
    df_day = df.copy()
    df_day['time_bucket'] = df_day['timestamp'].dt.floor('D')
    df_day['granularity'] = 'day'
    
    df_hour = df.copy()
    df_hour['time_bucket'] = df_hour['timestamp'].dt.floor('H')
    df_hour['granularity'] = 'hour'
    
    df_10min = df.copy()
    df_10min['time_bucket'] = df_10min['timestamp'].dt.floor('10min')
    df_10min['granularity'] = '10min'
    
    # Combine all granularities
    result = pd.concat([df_day, df_hour, df_10min])
    
    # Calculate average response time for each time bucket and person
    agg_df = result.groupby(['time_bucket', 'responder', 'granularity'])['response_time_min'].agg(
        ['mean', 'count', 'median']).reset_index()
    
    return agg_df

multi_granular_df = create_multi_granular_df(response_df)

# Create the interactive plot
def create_dynamic_plot(df):
    # Create figure
    fig = go.Figure()
    
    # Add traces for each person
    for person in df['responder'].unique():
        for granularity in ['day', 'hour', '10min']:
            person_data = df[(df['responder'] == person) & (df['granularity'] == granularity)]
            
            # Set visibility based on granularity
            visible = True if granularity == 'day' else 'legendonly'
            
            fig.add_trace(go.Scatter(
                x=person_data['time_bucket'],
                y=person_data['mean'],
                mode='lines+markers',
                name=f"{person} ({granularity})",
                visible=visible,
                hovertemplate='<b>%{x}</b><br>Avg Response: %{y:.1f} min<br>Median: %{customdata[0]:.1f} min<br>Count: %{customdata[1]}',
                customdata=person_data[['median', 'count']],
                line=dict(width=2)
            ))
    
    # Create buttons for changing granularity
    granularity_buttons = [
        dict(
            label="Daily Average",
            method="update",
            args=[{"visible": [g == 'day' for p in df['responder'].unique() for g in ['day', 'hour', '10min']]}]
        ),
        dict(
            label="Hourly Average",
            method="update",
            args=[{"visible": [g == 'hour' for p in df['responder'].unique() for g in ['day', 'hour', '10min']]}]
        ),
        dict(
            label="10-Minute Average",
            method="update",
            args=[{"visible": [g == '10min' for p in df['responder'].unique() for g in ['day', 'hour', '10min']]}]
        )
    ]
    
    # Add buttons to the figure
    fig.update_layout(
        title="Average Response Time (Dynamic Granularity)",
        xaxis_title="Time",
        yaxis_title="Response Time (minutes)",
        updatemenus=[
            dict(
                type="buttons",
                direction="right",
                active=0,
                x=0.1,
                y=1.15,
                buttons=granularity_buttons
            )
        ],
        hovermode="closest",
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1
        )
    )
    
    return fig

# Create and save the plot
fig = create_dynamic_plot(multi_granular_df)
fig.write_html('dynamic_response_times.html')

print("Interactive plot created as 'dynamic_response_times.html'")
