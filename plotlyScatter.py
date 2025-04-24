import json
import plotly.graph_objects as go
import os
import plotly.io as pio

class PlotlyScatterChart:
    """Python版的散点图类，模仿plotlyScatter.js的功能"""
    
    def __init__(self, container=None):
        """初始化散点图类
        
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
        self.is_select_mode = False  # 选择模式状态标记
        self.is_property_view_mode = False  # 属性查看模式状态标记
        self.selected_points = set()  # 存储被选中的点
        self.hidden_points = set()  # 存储被隐藏的点
        self.point_ids = []  # 存储所有点的id
        self.extended_data = []  # 存储扩展属性
        
    def init(self, options=None):
        """初始化散点图
        
        Args:
            options: 配置选项
                - data: 数据对象 {x: [], y: [], v: [], visible: [], id: []}
                - style: 样式配置
                - layout: 布局配置
        """
        if options is None:
            options = {}
            
        data = options.get("data", {})
        style = options.get("style", {})
        layout = options.get("layout", {})
        
        # 保存点的id和扩展属性
        self.point_ids = data.get("id", [])
        
        # 处理扩展属性
        a_values = data.get("a", [])
        if a_values:
            self.extended_data = []
            for i in range(len(a_values)):
                self.extended_data.append({
                    "a": data.get("a", [])[i] if i < len(data.get("a", [])) else None,
                    "b": data.get("b", [])[i] if i < len(data.get("b", [])) else None,
                    "m": data.get("m", [])[i] if i < len(data.get("m", [])) else None,
                    "n": data.get("n", [])[i] if i < len(data.get("n", [])) else None,
                    "row": data.get("row", [])[i] if i < len(data.get("row", [])) else None,
                    "pseu": data.get("pseu", [])[i] if i < len(data.get("pseu", [])) else None
                })
        
        # 根据visible数组初始化点的不透明度
        visible_data = data.get("visible", [])
        opacities = [0 if v == 1 else 1 for v in visible_data]
        
        # 初始化隐藏点集合
        for i, v in enumerate(visible_data):
            if v == 1:
                self.hidden_points.add(i)
        
        # 处理颜色刻度
        color_scale = style.get("colorscale", None)
        
        # 创建散点图
        scatter_trace = go.Scatter(
            x=data.get("x", []),
            y=data.get("y", []),
            mode=style.get("mode", "markers"),
            marker=dict(
                size=style.get("markerSize", 7),
                color=data.get("v", []),
                colorscale=color_scale,
                symbol='square',
                opacity=opacities,
                line=dict(
                    color=["white"] * len(data.get("x", [])),
                    width=[1] * len(data.get("x", []))
                ),
                showscale=False
            ),
            hovertemplate=(
                "X: %{x}<br>"
                "Y: %{y}<br>"
                "Value: %{marker.color}<br>"
                "a: %{customdata[0]}<br>"
                "b: %{customdata[1]}"
                "<extra></extra>"
            ),
            customdata=[[p.get("a", None), p.get("b", None)] for p in self.extended_data] if self.extended_data else None
        )
        
        # 创建布局
        self.layout = {
            "title": layout.get("title", ""),
            "showlegend": False,
            "hovermode": "closest",
            "dragmode": "pan",
            "xaxis": {
                "title": layout.get("xAxisTitle", ""),
                "showgrid": True,
                "zeroline": True,
                "autorange": True,
                "showline": True,
                "side": "top",
            },
            "yaxis": {
                "title": layout.get("yAxisTitle", ""),
                "showgrid": True,
                "zeroline": True,
                "autorange": "reversed",
                "showline": True,
            },
            "margin": {"t": 50, "l": 50, "r": 50, "b": 50}
        }
        
        # 更新自定义布局
        self.layout.update(layout)
        
        # 创建图表
        self.fig = go.Figure(data=[scatter_trace], layout=self.layout)
        
        # 保存数据引用
        self.data = [scatter_trace]
        
        return self.fig
    
    def update_data(self, new_data):
        """更新数据
        
        Args:
            new_data: 新数据列表，每个元素是 {x, y, text} 格式的字典
        """
        if not self.fig:
            return
            
        x_values = [point.get("x") for point in new_data]
        y_values = [point.get("y") for point in new_data]
        text_values = [point.get("text") for point in new_data]
        
        self.fig.update_traces(x=x_values, y=y_values, text=text_values)
    
    def update_layout(self, new_layout):
        """更新布局
        
        Args:
            new_layout: 新布局配置
        """
        if not self.fig:
            return
            
        self.fig.update_layout(**new_layout)
    
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
    
    def show(self):
        """显示图表"""
        if not self.fig:
            print("图表未初始化，无法显示")
            return
        
        self.fig.show()
    
    def hide_selected_points(self):
        """隐藏选中的点"""
        if not self.fig or not self.selected_points:
            return
        
        # 获取当前不透明度
        current_opacities = self.fig.data[0].marker.opacity or [1] * len(self.fig.data[0].x)
        
        # 创建新的不透明度数组
        new_opacities = list(current_opacities)
        
        # 更新选中点的不透明度
        for idx in self.selected_points:
            self.hidden_points.add(idx)
            new_opacities[idx] = 0
        
        # 更新图表
        self.fig.update_traces(marker=dict(opacity=new_opacities))
        
        # 清除选中状态
        self.selected_points.clear()
    
    def show_hidden_points(self):
        """显示所有被隐藏的点"""
        if not self.fig or not self.hidden_points:
            return
        
        # 获取当前不透明度
        current_opacities = self.fig.data[0].marker.opacity or [1] * len(self.fig.data[0].x)
        
        # 创建新的不透明度数组
        new_opacities = list(current_opacities)
        
        # 更新隐藏点的不透明度
        for idx in self.hidden_points:
            new_opacities[idx] = 1
        
        # 更新图表
        self.fig.update_traces(marker=dict(opacity=new_opacities))
        
        # 清空隐藏点集合
        self.hidden_points.clear()

# 使用示例
def load_plot_data(data_file):
    """载入绘图数据
    
    Args:
        data_file: 数据文件路径
    
    Returns:
        dict: 加载的数据
    """
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            return json.load(f)
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
            return data.get("colorScale", [])
    except Exception as e:
        print(f"载入颜色刻度时出错: {e}")
        return []

if __name__ == "__main__":
    # 载入数据和颜色刻度
    plot_data = load_plot_data("plotlyData.json")
    color_scale = load_color_scale("plotlyColorScale.json")
    
    # 创建散点图实例
    scatter_chart = PlotlyScatterChart()
    
    # 初始化散点图
    scatter_chart.init({
        "data": plot_data,
        "style": {
            "mode": "markers",
            "markerSize": 8,
            "colorscale": color_scale
        },
        "layout": {
            "title": "Scatter Plot Demo",
            "xaxis": {"title": "X Axis"},
            "yaxis": {"title": "Y Axis"}
        }
    })
    
    # 显示图表（交互式）
    scatter_chart.show()
    
    # 保存为图片
    scatter_chart.save_figure("scatter_plot.png")
    
    # 也可以保存为HTML（交互式）
    scatter_chart.save_as_html("scatter_plot.html")
