import plotly.graph_objects as go
import plotly.io as pio
import sys
import subprocess
import os

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

# Create sample data
x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
y = [2, 4, 3, 5, 4, 6, 5, 7, 6, 8]

print("Creating figure...")

# Create scatter plot using graph_objects
fig = go.Figure()

fig.add_trace(go.Scatter(
    x=x,
    y=y,
    mode='markers',
    marker=dict(
        size=10,
        color='rgb(51, 153, 255)',
        opacity=0.7
    ),
    name='Data Points'
))

# Update layout for better appearance
fig.update_layout(
    title={
        'text': "Sample Scatter Plot",
        'x': 0.5,
        'xanchor': 'center'
    },
    plot_bgcolor='white',
    width=800,
    height=600,
    xaxis_title="X Axis",
    yaxis_title="Y Axis"
)

# Add grid lines
fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor='LightGray')
fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor='LightGray')

print("Attempting to save image...")

try:
    # Try to save directly as PNG
    fig.write_image(
        "scatter_plot.png",
        format="png",
        engine="kaleido",
        width=800,
        height=600
    )
    print("Image saved successfully!")
except Exception as e:
    print(f"Error saving image: {e}")
    print("Saving as HTML instead...")
    fig.write_html("scatter_plot.html")
    print("Saved as HTML. You can open it in a browser.")

print("Script completed.")
