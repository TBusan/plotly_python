import plotly.graph_objects as go
# import plotly.express as px
import plotly.io as pio
# import numpy as np
from plotly.subplots import make_subplots
import sys
import subprocess
import os
import random
import math

print("Starting the script...")
print(f"Python version: {sys.version}")

# Check if kaleido is properly installed
try:
    import kaleido
    print(f"Kaleido version: {kaleido.__version__}")
except ImportError:
    print("Kaleido not found, attempting to install...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "kaleido==0.1.0.post1"])
    import kaleido
    print(f"Installed Kaleido version: {kaleido.__version__}")

# Set Plotly configuration
pio.renderers.default = None  # Disable automatic browser opening
os.environ['PLOTLY_RENDERER'] = 'png'

def save_figure(fig, filename):
    """Helper function to save figures"""
    try:
        fig.write_image(filename, engine="kaleido")
        print(f"Saved {filename} successfully!")
    except Exception as e:
        print(f"Error saving {filename}: {e}")
        html_file = filename.replace('.png', '.html')
        fig.write_html(html_file)
        print(f"Saved as {html_file} instead")

# 1. Scatter Plot
print("\n1. Creating Scatter Plot...")
x = [random.gauss(0, 1) for _ in range(100)]
y = [random.gauss(0, 1) for _ in range(100)]
fig1 = go.Figure(data=go.Scatter(
    x=x, y=y, mode='markers',
    marker=dict(size=10, color=x, colorscale='Viridis', showscale=True)
))
fig1.update_layout(title="Scatter Plot with Color Scale", width=800, height=600)
save_figure(fig1, "1_scatter_plot.png")

# 2. Contour Plot (等值线图)
print("\n2. Creating Contour Plot...")
x = [i/10 for i in range(-20, 21)]  # -2 to 2 in steps of 0.1
y = [i/10 for i in range(-20, 21)]
z = [[math.sin(x[i]) * math.cos(y[j]) for i in range(len(x))] for j in range(len(y))]
fig2 = go.Figure(data=go.Contour(x=x, y=y, z=z, colorscale='Viridis'))
fig2.update_layout(title="Contour Plot", width=800, height=600)
save_figure(fig2, "2_contour_plot.png")

# 3. Bar Chart
print("\n3. Creating Bar Chart...")
categories = ['A', 'B', 'C', 'D', 'E']
values = [random.randint(10, 50) for _ in range(5)]
fig3 = go.Figure(data=go.Bar(
    x=categories, y=values,
    marker_color='rgb(55, 83, 109)'
))
fig3.update_layout(title="Bar Chart", width=800, height=600)
save_figure(fig3, "3_bar_chart.png")

# 4. Line Plot
print("\n4. Creating Line Plot...")
x = [i/10 for i in range(100)]  # 0 to 10 in steps of 0.1
y = [math.sin(x_val) for x_val in x]
fig4 = go.Figure(data=go.Scatter(x=x, y=y, mode='lines'))
fig4.update_layout(title="Line Plot", width=800, height=600)
save_figure(fig4, "4_line_plot.png")

# 5. 3D Surface Plot
print("\n5. Creating 3D Surface Plot...")
x_range = range(-10, 11)
z_data = [[math.sin(math.sqrt(x*x + y*y)/2) for x in x_range] for y in x_range]
fig5 = go.Figure(data=go.Surface(z=z_data))
fig5.update_layout(title="3D Surface Plot", width=800, height=800)
save_figure(fig5, "5_surface_plot.png")

# 6. Pie Chart
print("\n6. Creating Pie Chart...")
labels = ['A', 'B', 'C', 'D']
values = [20, 30, 15, 35]
fig6 = go.Figure(data=go.Pie(labels=labels, values=values))
fig6.update_layout(title="Pie Chart", width=800, height=600)
save_figure(fig6, "6_pie_chart.png")

# 7. Box Plot
print("\n7. Creating Box Plot...")
data = [[random.gauss(0, std) for _ in range(100)] for std in [1, 2, 3]]
fig7 = go.Figure()
for i in range(3):
    fig7.add_trace(go.Box(y=data[i], name=f'Group {i+1}'))
fig7.update_layout(title="Box Plot", width=800, height=600)
save_figure(fig7, "7_box_plot.png")

# 8. Heatmap
print("\n8. Creating Heatmap...")
data = [[random.random() for _ in range(10)] for _ in range(10)]
fig8 = go.Figure(data=go.Heatmap(z=data, colorscale='Viridis'))
fig8.update_layout(title="Heatmap", width=800, height=600)
save_figure(fig8, "8_heatmap.png")

# 9. Bubble Chart
print("\n9. Creating Bubble Chart...")
x = [random.random() for _ in range(20)]
y = [random.random() for _ in range(20)]
size = [random.random() * 40 for _ in range(20)]
colors = [random.random() for _ in range(20)]
fig9 = go.Figure(data=go.Scatter(
    x=x, y=y,
    mode='markers',
    marker=dict(size=size, color=colors, showscale=True)
))
fig9.update_layout(title="Bubble Chart", width=800, height=600)
save_figure(fig9, "9_bubble_chart.png")

# 10. Multiple Plots in Subplots
print("\n10. Creating Subplots...")
fig10 = make_subplots(rows=2, cols=2, 
                      subplot_titles=("Scatter", "Line", "Bar", "Box"))

# Add different types of plots to the subplots
fig10.add_trace(go.Scatter(x=[1,2,3], y=[4,5,6], mode="markers"), row=1, col=1)
fig10.add_trace(go.Scatter(x=[1,2,3], y=[2,1,3], mode="lines"), row=1, col=2)
fig10.add_trace(go.Bar(x=[1,2,3], y=[2,5,3]), row=2, col=1)
fig10.add_trace(go.Box(y=[random.gauss(0, 1) for _ in range(50)]), row=2, col=2)

fig10.update_layout(title="Multiple Plots", width=1000, height=800, showlegend=False)
save_figure(fig10, "10_subplots.png")

print("\nAll plots have been created and saved!")

print("Script completed.")
