

# 使用示例
import plotly.graph_objects as go
from plotly.io import write_image

fig = go.Figure(go.Scatter(x=[1, 2, 3], y=[1, 3, 2]))
write_image(fig, 'figure.png')  # 自动使用Kaleido作为后端