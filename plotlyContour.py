import json
import plotly.graph_objects as go
import plotly.io as pio
import os
from datetime import datetime

class PlotlyContourChart:
    """Python版的等值线图类，模仿plotlyContour.js的功能"""
    
    def __init__(self, container=None):
        """初始化等值线图类
        
        Args:
            container: 在JS版中是DOM容器，在Python版中可以忽略
        """
        self.container = container
        self.fig = None  # plotly图表对象
        self.data = []  # 数据
        self.layout = {}  # 布局配置
        self.config = {  # 图表配置
            "responsive": True,
            "displayModeBar": False,
            "scrollZoom": True
        }
        
    def init(self, options=None):
        """初始化等值线图
        
        Args:
            options: 配置选项
                - data: 数据对象 {x: [], y: [], z: [[]], zmin, zmax}
                - style: 样式配置，包含colorscale, showlines, lineColor, lineStyle, showLabels, labelColor等
                - layout: 布局配置
                
        Returns:
            fig: 返回创建的plotly图表对象
        """
        if options is None:
            options = {}
            
        data = options.get("data", {})
        style = options.get("style", {})
        layout = options.get("layout", {})
        
        # 检查数据
        if not all(key in data for key in ["x", "y", "z"]):
            print("数据格式不正确")
            return None
            
        # 创建等值线图
        contour_trace = go.Contour(
            x=data.get("x", []),
            y=data.get("y", []),
            z=data.get("z", []),
            zmin=data.get("zmin"),  # 最小值
            zmax=data.get("zmax"),  # 最大值
            colorscale=style.get("colorscale", None),  # 色阶
            contours=dict(
                showlines=style.get("showlines", True),  # 是否显示等值线
                showlabels=style.get("showLabels", False),  # 是否显示标签
                labelfont=dict(
                    size=style.get("labelSize", 12),
                    color=style.get("labelColor", "white")
                )
            ),
            line=dict(
                width=1,  # 默认线宽
                color=style.get("lineColor", "#000"),
                dash=style.get("lineStyle", "solid")
            ),
            hoverongaps=False
        )
        
        # 创建布局
        self.layout = {
            "title": layout.get("title", ""),
            "showlegend": False,
            "hovermode": "closest",
            "margin": {"t": 50, "l": 50, "r": 50, "b": 50},
            "xaxis": {
                "title": layout.get("xAxisTitle", ""),
                "showgrid": True,
                "zeroline": True,
                "autorange": True
            },
            "yaxis": {
                "title": layout.get("yAxisTitle", ""),
                "showgrid": True,
                "zeroline": True,
                "autorange": True
            }
        }
        
        # 更新自定义布局
        layout_copy = layout.copy()
        if "xAxisTitle" in layout_copy:
            del layout_copy["xAxisTitle"]
        if "yAxisTitle" in layout_copy:
            del layout_copy["yAxisTitle"]
        self.layout.update(layout_copy)
        
        # 创建图表
        self.fig = go.Figure(data=[contour_trace], layout=self.layout)
        
        # 保存数据引用
        self.data = [contour_trace]
        
        return self.fig
    
    def set_color_range(self, range_values):
        """设置颜色范围
        
        Args:
            range_values: [min, max] 格式的列表
        """
        if not isinstance(range_values, list) or len(range_values) != 2:
            print("颜色范围格式不正确")
            return
            
        if not self.fig:
            print("图表未初始化")
            return
            
        self.fig.update_traces(zmin=range_values[0], zmax=range_values[1])
    
    def set_contour_interval(self, interval):
        """设置等值线间隔
        
        Args:
            interval: 间隔值
        """
        if not isinstance(interval, (int, float)):
            print("间隔值必须是数字")
            return
            
        if not self.fig:
            print("图表未初始化")
            return
            
        self.fig.update_traces(contours_size=interval)
    
    def update_color_scale(self, color_scale, contour_config=None, label_config=None):
        """更新颜色刻度和配置
        
        Args:
            color_scale: 新的配色数组，格式为 [[pos, color], ...]
            contour_config: 等值线配置，如 {showLines: True, color: "#000"}
            label_config: 标签配置，如 {showLabels: True, color: "#fff"}
        """
        if not isinstance(color_scale, list) or len(color_scale) < 2:
            print("配色数组格式不正确，至少需要包含两个颜色点")
            return
            
        if not self.fig:
            print("图表未初始化")
            return
            
        update_dict = dict(colorscale=color_scale)
        
        if contour_config:
            if "showLines" in contour_config:
                update_dict["contours_showlines"] = contour_config["showLines"]
            if "color" in contour_config:
                update_dict["line_color"] = contour_config["color"]
                
        if label_config:
            if "showLabels" in label_config:
                update_dict["contours_showlabels"] = label_config["showLabels"]
            if "color" in label_config:
                update_dict["contours_labelfont_color"] = label_config["color"]
                
        self.fig.update_traces(**update_dict)
    
    def get_value_range(self):
        """获取当前等值线图的值域范围
        
        Returns:
            dict: 值域范围对象，包含 zmin 和 zmax
        """
        if not self.fig or not self.fig.data or not self.fig.data[0]:
            print("等值线图未初始化")
            return None
            
        trace = self.fig.data[0]
        
        return {
            "zmin": trace.zmin if hasattr(trace, "zmin") else None,
            "zmax": trace.zmax if hasattr(trace, "zmax") else None
        }
    
    def show(self):
        """显示图表"""
        if not self.fig:
            print("图表未初始化，无法显示")
            return
        
        self.fig.show()
    
    def save_figure(self, filename, format="png"):
        """保存图表为图片
        
        Args:
            filename: 保存的文件名
            format: 图片格式，默认为png
        """
        if not self.fig:
            print("图表未初始化，无法保存")
            return False
        
        try:
            self.fig.write_image(
                filename,
                format=format,
                engine="kaleido",
                width=800,
                height=600
            )
            print(f"成功保存图表到 {filename}")
            return True
        except Exception as e:
            print(f"保存图表时出错: {e}")
            try:
                # 尝试保存为HTML作为备份
                html_file = filename.replace(f".{format}", ".html")
                self.fig.write_html(html_file)
                print(f"已保存为HTML格式: {html_file}")
            except Exception as html_err:
                print(f"保存HTML时也出错: {html_err}")
            return False
    
    def save_as_html(self, filename):
        """保存图表为HTML
        
        Args:
            filename: 保存的文件名
        """
        if not self.fig:
            print("图表未初始化，无法保存")
            return False
        
        try:
            self.fig.write_html(filename)
            print(f"成功保存图表到 {filename}")
            return True
        except Exception as e:
            print(f"保存HTML时出错: {e}")
            return False


# 使用示例
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

if __name__ == "__main__":
    # 载入数据和颜色刻度
    contour_data = load_contour_data("plotlyContourData.json")
    color_scale = load_color_scale("plotlyContourColorScale.json")
    
    # 创建其他样式配置
    style_config = {
        "colorscale": color_scale,
        "showlines": True,  # 显示等值线
        "lineColor": "#19AC4A",  # 等值线颜色
        "lineStyle": "solid",  # 等值线样式
        "showLabels": True,  # 显示标签
        "labelColor": "#19AC4A",  # 标签颜色
        "labelSize": 12  # 标签大小
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
            "width": 800,
            "height": 200
        }
    })
    
    # 显示图表（交互式）
    contour_chart.show()
    
    # 保存为图片
    contour_chart.save_figure("contour_plot.png")
    
    # 也可以保存为HTML（交互式）
    contour_chart.save_as_html("contour_plot.html")
    
    print("操作完成！")
