import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import numpy as np
from matplotlib.dates import DateFormatter
import matplotlib.ticker as ticker

# Set aesthetic parameters for better readability
plt.rcParams.update({
    'font.family': 'Arial',
    'font.size': 11,
    'axes.titlesize': 14,
    'axes.labelsize': 12,
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'figure.figsize': (14, 10),
    'figure.dpi': 120
})
sns.set_style("whitegrid")
colors = sns.color_palette("muted")

# Load and parse data
with open('../output/merged.json', 'r') as f:
    messages = json.load(f)

# Convert to DataFrame
df = pd.DataFrame(messages)
df['timestamp'] = pd.to_datetime(df['timestamp'], format='ISO8601')
df = df.sort_values('timestamp')

# Calculate response times
def calculate_response_times(df, max_response_time=60):
    """Calculate response times with improved conversation tracking"""
    response_times = []
    last_message = {}
    
    for idx, row in df.iterrows():
        current_sender = row['sender']
        current_time = row['timestamp']
        
        # Find who this might be responding to
        other_senders = [s for s in df['sender'].unique() if s != current_sender]
        
        for other in other_senders:
            if other in last_message:
                # Only consider as response if within reasonable time window (e.g., 24 hours)
                time_diff = (current_time - last_message[other]).total_seconds() / 60
                if time_diff <= 24*60:  # 24 hours max
                    response_times.append({
                        'responder': current_sender,
                        'original_sender': other,
                        'response_time_min': time_diff,
                        'timestamp': current_time,
                        'message': row['message'][:50] + '...' if len(row['message']) > 50 else row['message']
                    })
        
        # Update the last message time for this sender
        last_message[current_sender] = current_time
    
    response_df = pd.DataFrame(response_times)
    
    # Filter out extreme outliers for better visualization
    response_df['response_time_for_viz'] = response_df['response_time_min'].clip(0, max_response_time)
    
    return response_df

# Get response data
response_df = calculate_response_times(df)

# Add time-based features
response_df['date'] = response_df['timestamp'].dt.date
response_df['hour'] = response_df['timestamp'].dt.hour
response_df['day_of_week'] = response_df['timestamp'].dt.day_name()
response_df['month'] = response_df['timestamp'].dt.month_name()

# Create a rolling average function for smoother trends
def get_rolling_avg(data, window=7):
    return data.rolling(window=window, min_periods=1).mean()

# Set up the figure
fig = plt.figure(figsize=(14, 12))
fig.suptitle('Message Response Time Analysis', fontsize=16, y=0.98)

# 1. Response time by person - violin plot (more informative than boxplot)
ax1 = plt.subplot(2, 2, 1)
sns.violinplot(x='responder', y='response_time_for_viz', data=response_df, 
              palette=colors, inner='quartile', cut=0)
ax1.set_title('Response Time Distribution by Person')
ax1.set_ylabel('Response Time (minutes)')
ax1.set_xlabel('')
ax1.yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, pos: f'{int(x)}m'))

# 2. Weekly rolling average response time
ax2 = plt.subplot(2, 2, 2)
# Group by week and person for smoother trends
weekly_avg = response_df.groupby(['responder', pd.Grouper(key='timestamp', freq='W')])['response_time_min'].mean().reset_index()

for i, person in enumerate(weekly_avg['responder'].unique()):
    person_data = weekly_avg[weekly_avg['responder'] == person]
    # Sort by timestamp to ensure proper line
    person_data = person_data.sort_values('timestamp')
    ax2.plot(person_data['timestamp'], person_data['response_time_min'], 
            label=person, color=colors[i], linewidth=2.5, marker='o', markersize=5)

ax2.set_title('Weekly Average Response Time')
ax2.set_ylabel('Avg Response Time (minutes)')
ax2.set_xlabel('')
ax2.legend(loc='upper right', frameon=True)
ax2.yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, pos: f'{int(x)}m'))
ax2.xaxis.set_major_formatter(DateFormatter('%b %Y'))
ax2.grid(True, alpha=0.3)

# 3. Response time heatmap by hour and day
ax3 = plt.subplot(2, 2, 3)
# Better heatmap with day of week and hour
pivot_data = response_df.pivot_table(
    index='day_of_week', 
    columns='hour',
    values='response_time_min', 
    aggfunc='mean'
)
# Reorder days correctly
day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
pivot_data = pivot_data.reindex(day_order)

sns.heatmap(pivot_data, cmap='viridis', ax=ax3, annot=False, fmt='.1f', 
           cbar_kws={'label': 'Avg Response Time (min)'})
ax3.set_title('Response Time by Hour and Day of Week')
ax3.set_xlabel('Hour of Day')
ax3.set_ylabel('')

# 4. Response time density plot (more elegant than histogram)
ax4 = plt.subplot(2, 2, 4)
for i, person in enumerate(response_df['responder'].unique()):
    person_data = response_df[response_df['responder'] == person]
    sns.kdeplot(person_data['response_time_for_viz'], label=person, 
               ax=ax4, color=colors[i], linewidth=2.5, shade=True, alpha=0.25)
ax4.set_title('Response Time Distribution Density')
ax4.set_xlabel('Response Time (minutes)')
ax4.set_ylabel('Density')
ax4.legend(loc='upper right', frameon=True)
ax4.xaxis.set_major_formatter(ticker.FuncFormatter(lambda x, pos: f'{int(x)}m'))

plt.tight_layout(rect=[0, 0, 1, 0.96])
plt.savefig('message_analytics.png', dpi=150, bbox_inches='tight')
plt.show()

# Generate summary stats table
summary = response_df.groupby('responder')['response_time_min'].agg([
    ('Mean', 'mean'),
    ('Median', 'median'),
    ('Min', 'min'),
    ('Max', 'max'),
    ('Count', 'count')
]).round(1)

print("\n=== Response Time Summary (minutes) ===")
print(summary)

# Find fastest responses
fastest = response_df.sort_values('response_time_min').head(5)[['responder', 'original_sender', 'response_time_min', 'message']]
print("\n=== Fastest Responses ===")
print(fastest)
