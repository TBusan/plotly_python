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
        self.header_trace_index = None  # 存储头节点图层的索引
        
    def init(self, options=None):
        """初始化散点图
        
        Args:
            options: 配置选项
                - data: 数据对象 {x: [], y: [], v: [], visible: [], id: []}
                - style: 样式配置
                - layout: 布局配置
                - yaxis_reversed: 是否反转Y轴，默认为True
        """
        if options is None:
            options = {}
            
        data = options.get("data", {})
        style = options.get("style", {})
        layout = options.get("layout", {})
        yaxis_reversed = options.get("yaxis_reversed", True)  # 默认反转Y轴
        
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
        
        # 根据visible数组初始化点的不透明度（0=显示，1=隐藏）
        visible_data = data.get("visible", [])
        # 修改逻辑：1表示隐藏（不透明度为0），0表示显示（不透明度为1）
        opacities = [0 if v == 1 else 1 for v in visible_data]
        
        # 初始化隐藏点集合
        self.hidden_points.clear()  # 先清空集合
        for i, v in enumerate(visible_data):
            if v == 1:  # 1表示隐藏
                self.hidden_points.add(i)
        
        print(f"初始隐藏点数量: {len(self.hidden_points)}")
        
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
                showscale=False  # 将showscale移到marker中
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
                "title": layout.get("xAxisTitle", ""),  # 这里使用layout中的xAxisTitle作为xaxis.title
                "showgrid": True,
                "zeroline": True,
                "autorange": True,
                "showline": True,
                "side": "top",
            },
            "yaxis": {
                "title": layout.get("yAxisTitle", ""),  # 这里使用layout中的yAxisTitle作为yaxis.title
                "showgrid": True,
                "zeroline": True,
                "autorange": "reversed" if yaxis_reversed else True,  # 根据配置设置Y轴是否反转
                "showline": True,
            },
            "margin": {"t": 50, "l": 50, "r": 50, "b": 50}
        }
        
        # 更新自定义布局，但需要移除xAxisTitle和yAxisTitle，它们不是有效的Layout属性
        layout_copy = layout.copy()
        if "xAxisTitle" in layout_copy:
            del layout_copy["xAxisTitle"]
        if "yAxisTitle" in layout_copy:
            del layout_copy["yAxisTitle"]
        
        # 检查是否有明确的Y轴配置
        if "yaxis" in layout_copy:
            # 如果没有自定义autorange，添加我们的设置
            if "autorange" not in layout_copy["yaxis"]:
                layout_copy["yaxis"]["autorange"] = "reversed" if yaxis_reversed else True
        
        # 更新其他有效的布局属性
        self.layout.update(layout_copy)
        
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
    
    def flip_y_axis(self, reversed=True):
        """翻转Y轴
        
        Args:
            reversed: 是否反转Y轴，True表示反转，False表示正常方向
        """
        if not self.fig:
            return
        
        self.fig.update_layout(
            yaxis_autorange="reversed" if reversed else True
        )
        print(f"Y轴方向已{'反转' if reversed else '恢复正常'}")
    
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
        
    def addHeaderPoints(self, header_data):
        """添加头节点
        
        Args:
            header_data: 头节点数据，格式为 {headOption: {}, headerData: []}
                headOption: 头节点样式配置
                headerData: 头节点数据，每个元素是 {x, y, v, num} 格式的字典
        
        Returns:
            int: 添加的头节点图层的索引
        """
        if not self.fig:
            print("图表未初始化，无法添加头节点")
            return -1
            
        # 获取头节点数据和样式配置
        header_data_points = header_data.get("headerData", [])
        head_option = header_data.get("headOption", {})
        
        if not header_data_points:
            print("头节点数据为空")
            return -1
        
        # 提取数据
        x_values = [point.get("x") for point in header_data_points]
        y_values = [point.get("y") for point in header_data_points]
        v_values = [point.get("v") for point in header_data_points]
        num_values = [point.get("num") for point in header_data_points]
        
        # 获取样式配置
        marker_size = head_option.get("markerSize", 16)
        marker_symbol = head_option.get("markerSymbol", "diamond")
        marker_color = head_option.get("markerColor", "blue")
        marker_line = head_option.get("markerLine", {"color": "white", "width": 2})
        show_labels = head_option.get("showLabels", True)
        
        # 创建头节点图层
        header_trace = go.Scatter(
            x=x_values,
            y=y_values,
            mode='markers+text' if show_labels else 'markers',
            marker=dict(
                size=marker_size,
                color=marker_color,
                symbol=marker_symbol,
                line=dict(
                    color=marker_line.get("color", "white"),
                    width=marker_line.get("width", 2)
                )
            ),
            text=num_values if show_labels else None,
            textposition='top center',
            textfont=dict(
                family='Arial',
                size=12,
                color='black'
            ),
            hovertemplate=(
                "X: %{x}<br>"
                "Y: %{y}<br>"
                "Num: %{text}<br>"
                "<extra></extra>"
            ),
            customdata=num_values,
            name='Header Points',
            showlegend=False
        )
        
        # 添加头节点图层
        self.fig.add_trace(header_trace)
        
        # 保存头节点图层索引
        self.header_trace_index = len(self.fig.data) - 1
        
        print(f"添加了 {len(header_data_points)} 个头节点")
        
        return self.header_trace_index
    
    def removeHeaderPoints(self):
        """移除头节点图层"""
        if not self.fig or self.header_trace_index is None:
            return
        
        # 删除头节点图层
        self.fig.data = [trace for i, trace in enumerate(self.fig.data) if i != self.header_trace_index]
        
        # 重置头节点图层索引
        self.header_trace_index = None
        
        print("头节点图层已移除")

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
            data = json.load(f)
            print(f"成功加载 {data_file}，包含数据点: {len(data.get('x', []))}")
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
            return data.get("colorScale", [])
    except Exception as e:
        print(f"载入颜色刻度时出错: {e}")
        return []

def load_header_data(header_data_file):
    """载入头节点数据
    
    Args:
        header_data_file: 头节点数据文件路径
    
    Returns:
        dict: 头节点数据和配置
    """
    try:
        with open(header_data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            header_data = data.get("headerData", [])
            print(f"成功加载 {header_data_file}，包含 {len(header_data)} 个头节点")
            return data
    except Exception as e:
        print(f"载入头节点数据时出错: {e}")
        return {}

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
            "xaxis": {"title": "X Axis"},  # 正确的Python plotly轴标题设置
            "yaxis": {"title": "Y Axis"}   # 正确的Python plotly轴标题设置
        },
        "yaxis_reversed": True  # 设置Y轴是否翻转，默认为True
    })
    
    # 显示图表（交互式）
    scatter_chart.show()
    
    # 保存为图片
    scatter_chart.save_figure("scatter_plot.png")
    
    # 也可以保存为HTML（交互式）
    scatter_chart.save_as_html("scatter_plot.html")
