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
            "margin": {"t": 50, "l": 50, "r": 100, "b": 50}
        }
    })
    
    # 6. 添加头节点
    trace_index = scatter_chart.addHeaderPoints(header_data)
    if trace_index < 0:
        print("添加头节点失败")
    else:
        print(f"成功添加头节点，图层索引: {trace_index}")
    
    # 7. 添加自定义颜色条
    color_stops = [[10, 'red'], [50, 'green'], [100, 'blue']]
    scatter_chart.addCustomColorBar(
        color_stops,
        title="自定义颜色条",
        x_position=1.05,
        y_position=[0.2, 0.8],
        width=0.04,
        tick_length=0.02,
        tick_text_offset=0.03,
        font_size=14,
        title_font_size=16,
        title_offset=0.07
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