import json
import plotly.graph_objects as go
import os
import plotly.io as pio
from typing import List, Union

class CustomColorBar:
    """
    使用add_shape方法创建自定义颜色条的类
    颜色条的颜色与刻度完全与传入的数组一致，不进行归一化处理
    """
    
    def __init__(
        self,
        color_stops: List[List[Union[int, float, str]]],
        x_position: float = 1.05,
        y_position: List[float] = [0.1, 0.9],
        width: float = 0.04,
        title: str = "颜色条",
        title_offset: float = 0.07,
        tick_length: float = 0.02,
        tick_text_offset: float = 0.03,
        tick_width: float = 2,
        font_size: int = 14,
        font_color: str = "black",
        title_font_size: int = 16,
        title_font_color: str = "black",
        auto_position: bool = True,  # 控制是否自动计算位置
        use_paper_coords: bool = True  # 使用纸面坐标系统
    ):
        """
        初始化自定义颜色条
        
        参数:
            color_stops: 颜色停止点列表，格式为 [[值1, '颜色1'], [值2, '颜色2'], ...]
            x_position: 颜色条的x位置 (相对于绘图区域，1.0是右边界)
            y_position: 颜色条的y范围 [底部, 顶部] (相对于绘图区域)
            width: 颜色条的宽度
            title: 颜色条的标题
            title_offset: 标题距离颜色条的偏移量
            tick_length: 刻度线的长度
            tick_text_offset: 刻度文本的偏移量
            tick_width: 刻度线的宽度
            font_size: 刻度文本的字体大小
            font_color: 刻度文本的颜色
            title_font_size: 标题的字体大小
            title_font_color: 标题的颜色
            auto_position: 是否自动计算颜色条位置
            use_paper_coords: 是否使用纸面坐标系统
        """
        self.color_stops = sorted(color_stops, key=lambda x: x[0])
        self.x_position = x_position
        self.y_position = y_position
        self.width = width
        self.title = title
        self.title_offset = title_offset
        self.tick_length = tick_length
        self.tick_text_offset = tick_text_offset
        self.tick_width = tick_width
        self.font_size = font_size
        self.font_color = font_color
        self.title_font_size = title_font_size
        self.title_font_color = title_font_color
        self.auto_position = auto_position
        self.use_paper_coords = use_paper_coords  # 是否使用纸面坐标系统
        
        # 提取值范围
        self.min_value = self.color_stops[0][0]
        self.max_value = self.color_stops[-1][0]
        self.value_range = self.max_value - self.min_value
        
        # 计算颜色条的高度
        self.y_height = self.y_position[1] - self.y_position[0]
    
    def _value_to_y_position(self, value: Union[int, float]) -> float:
        """将值转换为y坐标位置"""
        normalized = (value - self.min_value) / self.value_range
        return self.y_position[0] + normalized * self.y_height
    
    def add_to_figure(self, fig: go.Figure) -> go.Figure:
        """
        将自定义颜色条添加到Plotly图形中
        
        参数:
            fig: Plotly图形对象
            
        返回:
            更新后的Plotly图形对象
        """
        # 确保图表有足够的右边距
        if 'margin' not in fig.layout:
            fig.update_layout(margin=dict(r=150))
        elif hasattr(fig.layout.margin, 'r') and fig.layout.margin.r < 150:
            margin = dict(r=150)
            if hasattr(fig.layout.margin, 't'):
                margin['t'] = fig.layout.margin.t
            if hasattr(fig.layout.margin, 'l'):
                margin['l'] = fig.layout.margin.l
            if hasattr(fig.layout.margin, 'b'):
                margin['b'] = fig.layout.margin.b
            fig.update_layout(margin=margin)
            
        # 颜色条位置计算
        try:
            if self.auto_position:
                if self.use_paper_coords:
                    # 使用纸面坐标系统 (0-1范围，相对于整个图表区域)
                    self.x_position = 1.05  # 图表右侧5%
                    self.y_position = [0.1, 0.9]  # 从10%到90%高度
                    self.width = 0.04
                    self.tick_length = 0.02
                    self.tick_text_offset = 0.03
                    self.title_offset = 0.07
                else:
                    # 使用数据坐标系统，从实际数据点计算
                    x_data = []
                    y_data = []
                    
                    for trace in fig.data:
                        if hasattr(trace, 'x') and trace.x is not None:
                            x_data.extend([x for x in trace.x if x is not None])
                        if hasattr(trace, 'y') and trace.y is not None:
                            y_data.extend([y for y in trace.y if y is not None])
                    
                    # 如果有数据，计算范围
                    if x_data and y_data:
                        x_min = min(x_data)
                        x_max = max(x_data)
                        y_min = min(y_data)
                        y_max = max(y_data)
                        
                        # 计算颜色条位置
                        x_span = x_max - x_min
                        y_span = y_max - y_min
                        
                        self.x_position = x_max + 0.05 * x_span
                        self.width = 0.03 * x_span
                        self.y_position = [y_min + 0.05 * y_span, y_max - 0.05 * y_span]
                        
                        # 调整其他参数
                        self.tick_length = 0.015 * x_span
                        self.tick_text_offset = 0.02 * x_span
                        self.title_offset = 0.04 * x_span
                    else:
                        # 如果没有有效数据，回退到纸面坐标
                        print("无法从数据中计算颜色条位置，将使用默认纸面坐标")
                        self.use_paper_coords = True
                        self.x_position = 1.05
                        self.y_position = [0.1, 0.9]
                        self.width = 0.04
                        self.tick_length = 0.02
                        self.tick_text_offset = 0.03
                        self.title_offset = 0.07
            
            # 重新计算高度
            self.y_height = self.y_position[1] - self.y_position[0]
                
        except Exception as e:
            print(f"计算颜色条位置时出错: {e}，将使用默认位置")
            # 回退到安全的默认值
            self.use_paper_coords = True
            self.x_position = 1.05
            self.y_position = [0.1, 0.9]
            self.width = 0.04
            self.y_height = self.y_position[1] - self.y_position[0]
            self.tick_length = 0.02
            self.tick_text_offset = 0.03
            self.title_offset = 0.07
        
        # 根据坐标系统选择不同的添加方式
        if self.use_paper_coords:
            self._add_to_figure_paper_coords(fig)
        else:
            self._add_to_figure_data_coords(fig)
            
        return fig
        
    def _add_to_figure_paper_coords(self, fig: go.Figure) -> None:
        """使用纸面坐标系统添加颜色条"""
        # 添加颜色条的矩形段
        for i in range(len(self.color_stops) - 1):
            current_stop = self.color_stops[i]
            next_stop = self.color_stops[i + 1]
            
            current_value, current_color = current_stop
            next_value, next_color = next_stop
            
            # 计算相对位置 (0-1范围)
            y0_norm = (current_value - self.min_value) / self.value_range
            y1_norm = (next_value - self.min_value) / self.value_range
            
            # 映射到指定的y位置范围
            y0 = self.y_position[0] + y0_norm * self.y_height
            y1 = self.y_position[0] + y1_norm * self.y_height
            
            # 添加矩形，使用paper坐标系统
            fig.add_shape(
                type="rect",
                xref="paper",
                yref="paper",
                x0=self.x_position,
                y0=y0,
                x1=self.x_position + self.width,
                y1=y1,
                line=dict(width=0),
                fillcolor=current_color,
                layer="above"
            )
        
        # 添加颜色条边框
        fig.add_shape(
            type="rect",
            xref="paper",
            yref="paper",
            x0=self.x_position,
            y0=self.y_position[0],
            x1=self.x_position + self.width,
            y1=self.y_position[1],
            line=dict(color="black", width=1),
            fillcolor="rgba(0,0,0,0)",
            layer="above"
        )
        
        # 添加刻度线和标签
        for value, color in self.color_stops:
            # 计算相对位置
            y_norm = (value - self.min_value) / self.value_range
            y_pos = self.y_position[0] + y_norm * self.y_height
            
            # 添加刻度线
            fig.add_shape(
                type="line",
                xref="paper",
                yref="paper",
                x0=self.x_position,
                y0=y_pos,
                x1=self.x_position - self.tick_length,
                y1=y_pos,
                line=dict(color="black", width=self.tick_width),
                layer="above"
            )
            
            # 添加刻度文本
            fig.add_annotation(
                xref="paper",
                yref="paper",
                x=self.x_position - self.tick_length - self.tick_text_offset,
                y=y_pos,
                text=str(value),
                showarrow=False,
                xanchor="right",
                yanchor="middle",
                font=dict(size=self.font_size, color=self.font_color)
            )
        
        # 添加颜色条标题
        fig.add_annotation(
            xref="paper",
            yref="paper",
            x=self.x_position + self.width / 2,
            y=self.y_position[1] + self.title_offset,
            text=self.title,
            showarrow=False,
            xanchor="center",
            yanchor="bottom",
            font=dict(size=self.title_font_size, color=self.title_font_color)
        )
    
    def _add_to_figure_data_coords(self, fig: go.Figure) -> None:
        """使用数据坐标系统添加颜色条"""
        # 添加颜色条的矩形段
        for i in range(len(self.color_stops) - 1):
            current_stop = self.color_stops[i]
            next_stop = self.color_stops[i + 1]
            
            current_value, current_color = current_stop
            next_value, next_color = next_stop
            
            # 计算当前段的y坐标范围
            y0 = self._value_to_y_position(current_value)
            y1 = self._value_to_y_position(next_value)
            
            # 添加矩形，使用数据坐标系统
            fig.add_shape(
                type="rect",
                x0=self.x_position,
                y0=y0,
                x1=self.x_position + self.width,
                y1=y1,
                line=dict(width=0),
                fillcolor=current_color,
                layer="above"
            )
        
        # 添加颜色条边框
        fig.add_shape(
            type="rect",
            x0=self.x_position,
            y0=self.y_position[0],
            x1=self.x_position + self.width,
            y1=self.y_position[1],
            line=dict(color="black", width=1),
            fillcolor="rgba(0,0,0,0)",
            layer="above"
        )
        
        # 添加刻度线和标签
        for value, color in self.color_stops:
            y_pos = self._value_to_y_position(value)
            
            # 添加刻度线
            fig.add_shape(
                type="line",
                x0=self.x_position,
                y0=y_pos,
                x1=self.x_position - self.tick_length,
                y1=y_pos,
                line=dict(color="black", width=self.tick_width),
                layer="above"
            )
            
            # 添加刻度文本
            fig.add_annotation(
                x=self.x_position - self.tick_length - self.tick_text_offset,
                y=y_pos,
                text=str(value),
                showarrow=False,
                xanchor="right",
                yanchor="middle",
                font=dict(size=self.font_size, color=self.font_color)
            )
        
        # 添加颜色条标题
        fig.add_annotation(
            x=self.x_position + self.width / 2,
            y=self.y_position[1] + self.title_offset,
            text=self.title,
            showarrow=False,
            xanchor="center",
            yanchor="bottom",
            font=dict(size=self.title_font_size, color=self.title_font_color)
        )

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
        self.custom_colorbar = None  # 存储自定义颜色条
        
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
        
        # Add custom colorbar if it exists
        if self.custom_colorbar:
            self.custom_colorbar.add_to_figure(self.fig)
        
        self.fig.show(config=self.config)
    
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
                    - markerSize: 标记大小
                    - markerSymbol: 标记形状
                    - markerColor: 标记颜色
                    - markerLine: 标记边框配置
                    - showLabels: 是否显示标签
                    - smartLabels: 是否启用智能标签布局
                    - maxLabels: 最大显示标签数量
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
        
        # 智能标签配置
        smart_labels = head_option.get("smartLabels", False)
        max_labels = head_option.get("maxLabels", 50)
        
        # 处理标签显示
        text_values = num_values.copy()
        text_positions = ['top center'] * len(num_values)
        
        # 如果启用智能标签布局且点数量超过最大标签数
        if show_labels and smart_labels and len(header_data_points) > max_labels:
            # 方法1: 只显示部分标签
            step = max(1, round(len(header_data_points) / max_labels))
            text_values = [str(num) if i % step == 0 else "" for i, num in enumerate(num_values)]
            
            # 方法2（可选）: 交错显示标签位置
            # positions = ['top center', 'top right', 'top left', 'bottom center', 'bottom left', 'bottom right']
            # text_positions = []
            # for i in range(len(num_values)):
            #     if text_values[i] == "":
            #         text_positions.append('top center')  # 空标签位置无所谓
            #     else:
            #         text_positions.append(positions[i % len(positions)])
        
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
            text=text_values if show_labels else None,
            textposition=text_positions if len(text_positions) > 1 else 'top center',
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

    def addCustomColorBar(self, color_stops, **kwargs):
        """添加自定义颜色条
        
        Args:
            color_stops: 颜色停止点列表，格式为 [[值1, '颜色1'], [值2, '颜色2'], ...]
            **kwargs: 其他传递给CustomColorBar的参数
            
        Returns:
            CustomColorBar: 创建的自定义颜色条对象
        """
        if not self.fig:
            print("图表未初始化，无法添加自定义颜色条")
            return None
            
        # 创建自定义颜色条对象
        self.custom_colorbar = CustomColorBar(color_stops, **kwargs)
        
        # 将颜色条添加到图表
        self.custom_colorbar.add_to_figure(self.fig)
        
        print(f"已添加自定义颜色条，包含 {len(color_stops)} 个颜色停止点")
        
        return self.custom_colorbar

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
