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
