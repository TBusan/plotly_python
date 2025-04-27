import json
from plotlyScatter import PlotlyScatterChart, load_plot_data, load_color_scale, load_header_data

def main():
    # 1. 直接从文件加载数据
    plot_data = load_plot_data("plotlyData2.json")
    if not plot_data:
        print("未能加载plotlyData.json文件，请确保该文件存在并包含有效数据")
        return
    
    # 2. 直接从文件加载颜色刻度
    color_scale = load_color_scale("plotlyColorScale.json")
    if not color_scale:
        print("未能加载plotlyColorScale.json文件，请确保该文件存在并包含有效数据")
        return
    
    # 3. 加载头节点数据
    header_data = load_header_data("headerData.json")
    if not header_data:
        print("未能加载headerData.json文件，请确保该文件存在并包含有效数据")
        return
    
    print(f"已加载颜色刻度，包含 {len(color_scale)} 个颜色点")
    print(f"已加载数据，包含 {len(plot_data.get('x', []))} 个数据点")
    print(f"已加载头节点数据，包含 {len(header_data.get('headerData', []))} 个头节点")
    
    # 4. 创建散点图实例
    scatter_chart = PlotlyScatterChart()
    
    # 5. 初始化散点图
    scatter_chart.init({
        "data": plot_data,
        "style": {
            "mode": "markers",
            "markerSize": 10,
            "colorscale": color_scale
        },
        "layout": {
            "title": "数据可视化",
            "xaxis": {"title": "X 轴"},
            "yaxis": {"title": "Y 轴"},
            "width": 1000,
            "height": 800,
            "plot_bgcolor": "white",
            "margin": {"t": 50, "l": 50, "r": 150, "b": 50}
        }
    })
    
    # 6. 添加头节点
    trace_index = scatter_chart.addHeaderPoints(header_data)
    if trace_index < 0:
        print("添加头节点失败")
    else:
        print(f"成功添加头节点，图层索引: {trace_index}")
    
    # 7. 添加自定义颜色条
    color_stops = [
      [0, 'rgba(126,84,255,255)'],
      [10, 'rgba(99,66,255,255)'],
      [20, 'rgba(72,48,255,255)'],
      [30, 'rgba(45,30,255,255)'],
      [40, 'rgba(18,12,255,255)'],
      [50, 'rgba(0,15,240,255)'],
      [60, 'rgba(0,60,195,255)'],
      [70, 'rgba(0,105,150,255)'],
      [80, 'rgba(0,150,105,255)'],
      [90, 'rgba(0,195,60,255)'],
      [100, 'rgba(0,240,15,255)'],
      [110, 'rgba(30,255,0,255)'],
      [120, 'rgba(75,255,0,255)'],
      [130, 'rgba(120,255,0,255)'],
      [140, 'rgba(165,255,0,255)'],
      [150, 'rgba(210,255,0,255)'],
      [160, 'rgba(255,255,0,255)'],
      [170, 'rgba(255,228,0,255)'],
      [180, 'rgba(255,201,0,255)'],
      [190, 'rgba(255,174,0,255)'],
      [200, 'rgba(255,147,0,255)'],
      [210, 'rgba(255,120,0,255)'],
      [220, 'rgba(255,96,0,255)'],
      [230, 'rgba(255,78,0,255)'],
      [240, 'rgba(255,60,0,255)'],
      [250, 'rgba(255,42,0,255)'],
      [260, 'rgba(255,24,0,255)'],
      [270, 'rgba(255,6,0,255)'],
    ]
    scatter_chart.addCustomColorBar(
        color_stops,
        title="自定义颜色条",
        auto_position=True,
        use_paper_coords=True,  # 使用纸面坐标系统
        font_size=14,
        title_font_size=16
    )
    
    # 8. 显示图表（交互式）
    scatter_chart.show()
    
    # 9. 保存为PNG图片
    scatter_chart.save_figure("scatter_plot_with_headers.png")
    
    # 10. 也可以保存为HTML（交互式）
    scatter_chart.save_as_html("scatter_plot_with_headers.html")
    
    print("操作完成！")

if __name__ == "__main__":
    main() 