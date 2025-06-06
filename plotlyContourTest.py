import json
from plotlyContour import PlotlyContourChart

def load_contour_data(data_file):
    """载入等值线绘图数据
    
    Args:
        data_file: 数据文件路径
    
    Returns:
        dict: 加载的数据
    """
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"成功加载 {data_file}，包含数据点: {len(data.get('x', []))} x {len(data.get('y', []))}")
            return data
    except Exception as e:
        print(f"载入数据时出错: {e}")
        return {}

def load_color_scale(color_scale_file):
    """载入颜色刻度
    
    Args:
        color_scale_file: 颜色刻度文件路径
    
    Returns:
        list: 颜色刻度数组
    """
    try:
        with open(color_scale_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            color_scale = data.get("colorScale", [])
            print(f"成功加载 {color_scale_file}，包含 {len(color_scale)} 个颜色点")
            return color_scale
    except Exception as e:
        print(f"载入颜色刻度时出错: {e}")
        return []

def test_contour_plot():
    """测试等值线图的基本功能"""
    # 载入数据和颜色刻度
    contour_data = load_contour_data("plotlyContourData.json")
    color_scale = load_color_scale("plotlyContourColorScale.json")
    
    # 创建其他样式配置
    style_config = {
        "colorscale": color_scale,
        "showlines": True,  # 显示等值线
        "lineColor": "#1F2220",  # 等值线颜色
        "lineStyle": "solid",  # 等值线样式
        "showLabels": True,  # 显示标签
        "labelColor": "#1F2220",  # 标签颜色
        "labelSize": 12,  # 标签大小
        "showscale": False  # 不显示颜色条
    }
    
    # 创建等值线图实例
    contour_chart = PlotlyContourChart()
    
    # 初始化等值线图
    contour_chart.init({
        "data": contour_data,
        "style": style_config,
        "layout": {
            "title": "等值线图示例",
            "xAxisTitle": "X轴",
            "yAxisTitle": "Y轴",
            "width": 1200,
            "height": 600,  # 增加高度以便更好地显示
            "margin": {"t": 50, "l": 50, "r": 100, "b": 50}  # 增加右侧边距以容纳颜色条
        }
    })
    
    # 显示图表（交互式）
    contour_chart.show()
    
    # 保存为图片
    contour_chart.save_figure("contour_plot.png")
    
    # 也可以保存为HTML（交互式）
    contour_chart.save_as_html("contour_plot.html")
    
    return contour_chart

def test_shapes():
    """测试添加各种形状到等值线图"""
    # 先创建一个基本的等值线图
    contour_chart = test_contour_plot()
    
    # 尝试添加形状
    print("\n添加形状示例...")
    try:
        # 加载形状数据
        with open("plotlyContourShape.json", 'r', encoding='utf-8') as f:
            shape_data = json.load(f)
            
        # 添加点
        if "point" in shape_data:
            point_id = contour_chart.initShape(shape_data["point"])
            print(f"添加点形状成功，ID: {point_id}")
            
        # 添加线
        if "polyline" in shape_data:
            line_id = contour_chart.initShape(shape_data["polyline"])
            print(f"添加线形状成功，ID: {line_id}")
            
        # 添加多边形
        if "polygon" in shape_data:
            polygon_id = contour_chart.initShape(shape_data["polygon"])
            print(f"添加多边形形状成功，ID: {polygon_id}")
            
        # 添加文本
        if "text" in shape_data:
            text_id = contour_chart.initShape(shape_data["text"])
            print(f"添加文本形状成功，ID: {text_id}")
            
        # 保存带有形状的图表
        contour_chart.save_figure("contour_plot_with_shapes.png")
        contour_chart.save_as_html("contour_plot_with_shapes.html")
    except Exception as e:
        print(f"添加形状时出错: {e}")

def test_custom_colorbar():
    """测试自定义颜色条功能"""
    # 先创建一个基本的等值线图
    contour_data = load_contour_data("plotlyContourData.json")
    color_scale = load_color_scale("plotlyContourColorScale.json")
    
    # 创建其他样式配置
    style_config = {
        "colorscale": color_scale,
        "showlines": True,  # 显示等值线
        "lineColor": "#1F2220",  # 等值线颜色
        "lineStyle": "solid",  # 等值线样式
        "showLabels": True,  # 显示标签
        "labelColor": "#1F2220",  # 标签颜色
        "labelSize": 12,  # 标签大小
        "showscale": False  # 不显示颜色条
    }
    
    # 创建等值线图实例
    contour_chart = PlotlyContourChart()
    
    # 初始化等值线图
    contour_chart.init({
        "data": contour_data,
        "style": style_config,
        "layout": {
            "title": "等值线图示例",
            "xAxisTitle": "X轴",
            "yAxisTitle": "Y轴",
            "width": 1200,
            "height": 600,  # 增加高度以便更好地显示
            "margin": {"t": 50, "l": 50, "r": 200, "b": 50}  # 增加右侧边距以容纳颜色条
        }
    })
    
    # 显示图表（交互式）
 
    
    # 添加自定义颜色条
    print("\n添加自定义颜色条...")
    try:
        # 定义颜色停止点
        color_stops = [
            [0, 'rgba(126,84,255,255)'],
            [30, 'rgba(45,30,255,255)'],
            [60, 'rgba(0,60,195,255)'],
            [90, 'rgba(0,195,60,255)'],
            [120, 'rgba(75,255,0,255)'],
            [150, 'rgba(210,255,0,255)'],
            [180, 'rgba(255,201,0,255)'],
            [210, 'rgba(255,120,0,255)'],
            [240, 'rgba(255,60,0,255)'],
            [270, 'rgba(255,6,0,255)'],
        ]
        
        # 添加自定义颜色条
        contour_chart.addCustomColorBar(
            color_stops,
            title="数值范围",
            auto_position=True,
            use_paper_coords=True,
            width=0.035,
            font_size=12,
            title_font_size=14
        )
        
        contour_chart.show()
        # 保存带有自定义颜色条的图表
        contour_chart.save_figure("contour_plot_with_colorbar.png")
        contour_chart.save_as_html("contour_plot_with_colorbar.html")
        print("成功添加自定义颜色条并保存图表")
    except Exception as e:
        print(f"添加自定义颜色条时出错: {e}")

if __name__ == "__main__":
    test_custom_colorbar()  # 测试自定义颜色条
    print("操作完成！")
