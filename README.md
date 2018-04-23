# 热点图插件
> 一个可以在图片上创建跳转链接的一个插件

### 具体使用
```
new HotSpot(dom, option);//dom 为document节点, option 为对象
```

### 提供方法
目前只提供了2个方法

函数名 |参数| 函数介绍
---|--- | ---
outputElementJSON |无| 将创建的区域导出为html
drawElement |data(html字符串) 暂时使用localstorage缓存|解析html字符串，获取设置

*注意: 函数drawElement的传值暂时使用outputElementJSON调用时自动创建的localstorage缓存，暂时不需要传值，但使用前必须调用outputElementJSON*

### 可选参数(option)
可选参数 |默认值| 介绍
---|--- | ---
imageSrc |无| 生成图片的设置路径
clickResponse |200| 绘制的时间少于多少ms不进行创建(默认200ms)
closeBtnClassName |'hotspot-close'| 关闭按钮类名
closeBtnText |'关闭'| 生成图片的设置路径
closeBtnTextShow |true| 是否显示关闭按钮
liElementString |默认|可配置的控制li输出

默认的`liElementString`

```
<div class="child__node">
    <span class="child__node__text">
        这是第#index#个区域
    </span>
    <input data-hash='#hash#' type="text" data-url placeholder="输入绑定的url">
    <button data-hash='#hash#' data-type='sure'>确认</button>
    <button data-hash='#hash#' data-type='edit'>编辑</button>
    <button data-hash='#hash#' data-type='del'>删除</button>
</div>
```