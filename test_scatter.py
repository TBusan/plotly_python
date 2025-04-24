import json
from plotlyScatter import PlotlyScatterChart, load_plot_data, load_color_scale

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
    
    print(f"已加载颜色刻度，包含 {len(color_scale)} 个颜色点")
    print(f"已加载数据，包含 {len(plot_data.get('x', []))} 个数据点")
    
    # 3. 创建散点图实例
    scatter_chart = PlotlyScatterChart()
    
    # 4. 初始化散点图
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
            "plot_bgcolor": "white"
        }
    })
    
    # 5. 显示图表（交互式）
    scatter_chart.show()
    
    # 6. 保存为PNG图片
    scatter_chart.save_figure("scatter_plot_result.png")
    
    # 7. 也可以保存为HTML（交互式）
    scatter_chart.save_as_html("scatter_plot_result.html")
    
    print("操作完成！")

if __name__ == "__main__":
    main() 