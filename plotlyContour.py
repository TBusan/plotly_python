import json
import plotly.graph_objects as go
import plotly.io as pio
import os
from datetime import datetime
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
        tick_width: float = 0.1,
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
            fig.update_layout(margin=dict(r=200))  # 增加右边距
        elif hasattr(fig.layout.margin, 'r') and fig.layout.margin.r < 200:  # 增加最小边距
            margin = dict(r=200)
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
            line=dict(color="black", width=0),
            fillcolor="rgba(0,0,0,0)",
            layer="above"
        )
        
        # 添加刻度线和标签
        for value, color in self.color_stops:
            # 计算相对位置
            y_norm = (value - self.min_value) / self.value_range
            y_pos = self.y_position[0] + y_norm * self.y_height
            
            # 添加刻度线 - 移到右侧
            fig.add_shape(
                type="line",
                xref="paper",
                yref="paper",
                x0=self.x_position + self.width,  # 从颜色条右边缘开始
                y0=y_pos,
                x1=self.x_position + self.width + self.tick_length,  # 向右延伸
                y1=y_pos,
                line=dict(color="black", width=self.tick_width),
                layer="above"
            )
            
            # 添加刻度文本 - 移到右侧
            fig.add_annotation(
                xref="paper",
                yref="paper",
                x=self.x_position + self.width + self.tick_length + self.tick_text_offset,  # 位于刻度线右侧
                y=y_pos,
                text=str(value),
                showarrow=False,
                xanchor="left",  # 文本左对齐
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
            line=dict(color="black", width=0),
            fillcolor="rgba(0,0,0,0)",
            layer="above"
        )
        
        # 添加刻度线和标签
        for value, color in self.color_stops:
            y_pos = self._value_to_y_position(value)
            
            # 添加刻度线 - 移到右侧
            fig.add_shape(
                type="line",
                x0=self.x_position + self.width,  # 从颜色条右边缘开始
                y0=y_pos,
                x1=self.x_position + self.width + self.tick_length,  # 向右延伸
                y1=y_pos,
                line=dict(color="black", width=self.tick_width),
                layer="above"
            )
            
            # 添加刻度文本 - 移到右侧
            fig.add_annotation(
                x=self.x_position + self.width + self.tick_length + self.tick_text_offset,  # 位于刻度线右侧
                y=y_pos,
                text=str(value),
                showarrow=False,
                xanchor="left",  # 文本左对齐
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
        self.custom_colorbar = None  # 存储自定义颜色条
        
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
            showscale=style.get("showscale", False),  # 是否显示颜色条
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
    
    def _map_symbol(self, symbol):
        """将JSON中的symbol映射到Plotly支持的marker symbol
        
        Args:
            symbol: 输入的symbol字符串
            
        Returns:
            str: Plotly支持的symbol值
        """
        # 定义symbol映射关系
        symbol_map = {
            "solid": "circle",
            "circle": "circle",
            "square": "square",
            "diamond": "diamond",
            "cross": "cross",
            "x": "x",
            "triangle": "triangle-up",
            "pentagon": "pentagon",
            "hexagon": "hexagon",
            "star": "star"
        }
        
        # 如果symbol在映射字典中，返回映射值，否则返回默认值"circle"
        return symbol_map.get(symbol, "circle")
    
    def _map_line_type(self, line_type):
        """将JSON中的线型映射到Plotly支持的线型
        
        Args:
            line_type: 输入的线型字符串
            
        Returns:
            str: Plotly支持的线型
        """
        # 定义线型映射关系
        line_map = {
            "solid": "solid",
            "dash": "dash",
            "dot": "dot",
            "dashdot": "dashdot"
        }
        
        # 如果线型在映射字典中，返回映射值，否则返回默认值"solid"
        return line_map.get(line_type, "solid")
    
    def _map_pattern(self, pattern):
        """将JSON中的填充模式映射到Plotly支持的模式
        
        Args:
            pattern: 输入的填充模式字符串
            
        Returns:
            str: Plotly支持的填充模式
        """
        # 定义填充模式映射关系
        pattern_map = {
            "/": "/",         # 右斜线
            "-": "-",         # 水平线
            "|": "|",         # 垂直线
            "+": "+",         # 正交网格
            ".": ".",         # 圆点阵列
            "x": "x",         # 交叉线
            "": None          # 空字符串代表纯颜色填充
        }
        
        # 如果模式在映射字典中，返回映射值，否则返回None（纯颜色填充）
        return pattern_map.get(pattern, None)
    
    def initShape(self, shapeData):
        """初始化形状，添加点、线、多边形或文本到图表
        
        Args:
            shapeData: 形状数据，包含id、type、name、points和style等属性
            
        Returns:
            str: 成功返回形状的id，失败返回None
        """
        if not self.fig:
            print("图表未初始化，无法添加形状")
            return None
            
        if not isinstance(shapeData, dict) or "type" not in shapeData:
            print("形状数据格式不正确")
            return None
            
        shape_type = shapeData.get("type")
        shape_id = shapeData.get("id")
        points = shapeData.get("points", [])
        style = shapeData.get("style", {})
        name = shapeData.get("name", "")
        
        if not points:
            print("形状点数据为空")
            return None
            
        # 提取所有点的x和y坐标
        x_coords = [point.get("x") for point in points if "x" in point]
        y_coords = [point.get("y") for point in points if "y" in point]
        
        # 根据不同形状类型创建不同的Plotly图形
        if shape_type == "point":
            # 点形状包含点和文本两部分的样式
            point_trace = go.Scatter(
                x=x_coords,
                y=y_coords,
                mode="markers+text" if style.get("text", {}).get("show", False) else "markers",
                marker=dict(
                    color=style.get("color", "#000000"),
                    size=style.get("size", 8),
                    opacity=style.get("opacity", 100) / 100,
                    symbol=self._map_symbol(style.get("symbol", "circle"))
                ),
                text=style.get("text", {}).get("content", name) if style.get("text", {}).get("show", False) else None,
                textposition="top center",
                textfont=dict(
                    family=style.get("text", {}).get("fontFamily", "Arial"),
                    size=style.get("text", {}).get("size", 12),
                    color=style.get("text", {}).get("color", "#000000")
                ),
                showlegend=False,
                hoverinfo="text",
                hovertext=name,
                customdata=[shape_id],
                name=name
            )
            self.fig.add_trace(point_trace)
            
        elif shape_type == "polyline":
            # 线形状包含折点、线和文本三部分的样式
            # 创建线形状
            line_trace = go.Scatter(
                x=x_coords,
                y=y_coords,
                mode="lines+markers" + ("+text" if style.get("text", {}).get("show", False) else ""),
                line=dict(
                    color=style.get("color", "#000000"),
                    width=style.get("width", 1),
                    dash=self._map_line_type(style.get("type", "solid"))
                ),
                marker=dict(
                    color=style.get("marker", {}).get("color", "#000000"),
                    size=style.get("marker", {}).get("size", 8),
                    opacity=style.get("marker", {}).get("opacity", 1),
                    symbol=self._map_symbol(style.get("marker", {}).get("symbol", "circle"))
                ),
                showlegend=False,
                hoverinfo="text",
                hovertext=name,
                customdata=[shape_id],
                name=name
            )
            
            # 如果需要显示文本，计算中心位置
            if style.get("text", {}).get("show", False):
                # 计算中心位置
                center_x = sum(x_coords) / len(x_coords)
                center_y = sum(y_coords) / len(y_coords)
                
                # 添加文本
                text_trace = go.Scatter(
                    x=[center_x],
                    y=[center_y],
                    mode="text",
                    text=[style.get("text", {}).get("content", name)],
                    textposition="middle center",
                    textfont=dict(
                        family=style.get("text", {}).get("fontFamily", "Arial"),
                        size=style.get("text", {}).get("size", 12),
                        color=style.get("text", {}).get("color", "#000000")
                    ),
                    showlegend=False,
                    hoverinfo="none",
                    customdata=[f"{shape_id}_text"],
                    name=f"{name}_text"
                )
                self.fig.add_trace(line_trace)
                self.fig.add_trace(text_trace)
            else:
                self.fig.add_trace(line_trace)
            
        elif shape_type == "polygon":
            # 多边形形状包含折点、线、面和文本四部分的样式
            # 闭合多边形
            if x_coords[0] != x_coords[-1] or y_coords[0] != y_coords[-1]:
                x_coords.append(x_coords[0])
                y_coords.append(y_coords[0])
                
            # 设置线条样式
            line_style = style.get("lineStyle", {})
            # 设置填充样式
            fill_style = style.get("fillStyle", {})
            # 设置标记点样式
            marker_style = style.get("marker", {})
            
            # 基本属性
            polygon_attrs = dict(
                x=x_coords,
                y=y_coords,
                mode="lines+markers" + ("+text" if style.get("text", {}).get("show", False) else ""),
                line=dict(
                    color=line_style.get("color", "#000000"),
                    width=line_style.get("width", 1),
                    dash=self._map_line_type(line_style.get("type", "solid"))
                ),
                marker=dict(
                    color=marker_style.get("color", "#000000"),
                    size=marker_style.get("size", 8),
                    opacity=marker_style.get("opacity", 1),
                    symbol=self._map_symbol(marker_style.get("symbol", "circle"))
                ),
                fill="toself",
                showlegend=False,
                hoverinfo="text",
                hovertext=name,
                customdata=[shape_id],
                name=name
            )
            
            # 处理填充样式
            if fill_style.get("type") == "pattern":
                # 获取模式
                pattern_type = self._map_pattern(fill_style.get("pattern", ""))
                
                if pattern_type:
                    # 使用图案填充
                    polygon_attrs["fillpattern"] = dict(
                        shape=pattern_type,
                        bgcolor=fill_style.get("bgcolor", "#FFFFFF"),
                        fgcolor=line_style.get("color", "#000000"),
                        size=10  # 默认模式大小
                    )
                    polygon_attrs["opacity"] = 1  # 不透明度设为1，防止模式过淡
                else:
                    # 纯色填充
                    polygon_attrs["fillcolor"] = fill_style.get("bgcolor", "#000000")
                    polygon_attrs["opacity"] = fill_style.get("opacity", 1)
            else:
                # 默认纯色填充
                polygon_attrs["fillcolor"] = fill_style.get("bgcolor", "#000000")
                polygon_attrs["opacity"] = fill_style.get("opacity", 1)
            
            # 创建多边形
            polygon_trace = go.Scatter(**polygon_attrs)
            
            # 如果需要显示文本，计算中心位置
            if style.get("text", {}).get("show", False):
                # 计算中心位置（多边形质心）
                sum_x = sum(x_coords[:-1])  # 排除闭合点
                sum_y = sum(y_coords[:-1])
                center_x = sum_x / (len(x_coords) - 1)
                center_y = sum_y / (len(y_coords) - 1)
                
                # 添加文本
                text_trace = go.Scatter(
                    x=[center_x],
                    y=[center_y],
                    mode="text",
                    text=[style.get("text", {}).get("content", name)],
                    textposition="middle center",
                    textfont=dict(
                        family=style.get("text", {}).get("fontFamily", "Arial"),
                        size=style.get("text", {}).get("size", 12),
                        color=style.get("text", {}).get("color", "#000000")
                    ),
                    showlegend=False,
                    hoverinfo="none",
                    customdata=[f"{shape_id}_text"],
                    name=f"{name}_text"
                )
                self.fig.add_trace(polygon_trace)
                self.fig.add_trace(text_trace)
            else:
                self.fig.add_trace(polygon_trace)
            
        elif shape_type == "text":
            # 文本形状只有文本样式
            text_trace = go.Scatter(
                x=x_coords,
                y=y_coords,
                mode="text",
                text=[style.get("text", name)],
                textposition="middle center",
                textfont=dict(
                    family=style.get("font", "Arial"),
                    size=style.get("size", 12),
                    color=style.get("color", "#000000")
                ),
                showlegend=False,
                hoverinfo="text",
                hovertext=name,
                customdata=[shape_id],
                name=name
            )
            self.fig.add_trace(text_trace)
            
        else:
            print(f"不支持的形状类型: {shape_type}")
            return None
        
        return shape_id
        
    def show(self):
        """显示图表"""
        if not self.fig:
            print("图表未初始化，无法显示")
            return
        
        # 添加自定义颜色条（如果存在）
        if self.custom_colorbar:
            self.custom_colorbar.add_to_figure(self.fig)
            
        self.fig.show(config=self.config)
    
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
        
    def save_figure(self, filename, format="png"):
        """保存图表为图片
        
        Args:
            filename: 保存的文件名
            format: 图片格式，默认为png
        """
        if not self.fig:
            print("图表未初始化，无法保存")
            return False
        
        # 添加自定义颜色条（如果存在）
        if self.custom_colorbar:
            self.custom_colorbar.add_to_figure(self.fig)
            
        try:
            self.fig.write_image(
                filename,
                format=format,
                engine="kaleido",
                width=1200,
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
        
        # 添加自定义颜色条（如果存在）
        if self.custom_colorbar:
            self.custom_colorbar.add_to_figure(self.fig)
            
        try:
            self.fig.write_html(filename)
            print(f"成功保存图表到 {filename}")
            return True
        except Exception as e:
            print(f"保存HTML时出错: {e}")
            return False
