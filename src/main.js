import './style.scss'
import * as selfMode from './private-type'

/**
 * 
 * @param {dom} wrapper 选择的父容器节点
 * @param {obj} option 可选参数 {
 *                  clickResponse: 绘制的时间少于多少ms不进行创建(默认200ms)
 *                  imageSrc: 生成图片的设置路径,
 *                  closeBtnClassName: 关闭按钮类名(默认hotspot-close),
 *                  closeBtnText: 默认'关闭',
 *                  closeBtnTextShow: 默认true,
 *                  liElementString: '', 默认为空, 配置的控制台html字符串(#hash#字符串必须含有)        
 *                                  <div class="child__node">
    <span class="child__node__text">
        这是第#index#个区域
    </span>
    <input data-hash='#hash#' type="text" data-url placeholder="输入绑定的url">
    <button data-hash='#hash#' data-type='sure'>确认</button>
    <button data-hash='#hash#' data-type='edit'>编辑</button>
    <button data-hash='#hash#' data-type='del'>删除</button>
</div>
                    
 *              }
 * @class HotSpot
 */

 /**
  * dom获取函数
  * 
  * @param {any} node 
  * @param {any} type 是否数组
  * @returns 
  */
 function _$(node, type) {
    return type?document.querySelectorAll(node):document.querySelector(node);
 }

class HotSpot {
    constructor(wrapper, option) {
        let self             = this;
        //容器
        self.wrapper         = wrapper; //包裹元素
        self.parentPos       = {}; //父元素位置
        self.parent          = null; //绑定的父元素
        self.container       = null; //控制面板输出容器
        self.activeChildNode = null; //激活的子元素

        //选项
        self.option          =  {
                                   container: 'list', //容器id
                                   clickResponse: 200, //创建容器反应时间
                                   closeBtnText: '关闭',
                                   closeBtnTextShow: true
                                }
        
        //鼠标事件
        self.startPos        = {};//开始绘制的位置
        self.nowPos          = {}; //目前的鼠标位置
        self.startTime       = null; //开始绘制的时间
        self.endTime         = null; //结束绘制的时间
        self.STATUS          = '';

        //绘制元素记录信息
        self.imageInfo       = {}; //图片记录信息(宽高/链接)
        self.rectInfo        = {}; //绘制成功区域数据

        //已绘制的区域集合信息
        self.childNodeList   = [];
        self.dataNodeList    = []; //用于重绘信息

        //集合用户配置的信息
        self.option          = Object.assign(self.option, option);

        //绑定当前thiz指向
        self[selfMode._mouseDown]          = self[selfMode._mouseDown].bind(self);
        self[selfMode._mouseMove]          = self[selfMode._mouseMove].bind(self);
        self[selfMode._mouseUp]            = self[selfMode._mouseUp].bind(self);
        self[selfMode._closeBtnClickEvent] = self[selfMode._closeBtnClickEvent].bind(self);

        //初始化
        self[selfMode._initParent]();
    }

    /**
     * 初始化元素
     * 
     * @memberof HotSpot
     */
    [selfMode._initParent]() {
        let self = this;

        self[selfMode._getImageWidthHeightandSrc]().then((res) => {
            let parent = document.createElement('div');
            parent.id = 'parent';
            parent.style.cssText = `
                position: absolute;
                left: -1px;
                top: -1px;
                width: ${res.width}px;
                height: ${res.height}px;
                border: 1px solid #ddd;
                zIndex: 99;
            `

            self.imageInfo = res;
            self.wrapper.appendChild(parent);
            self.parent = parent;
            self[selfMode._initVariable]();
            self[selfMode._initEvent]();
            self[selfMode._initSetting]();
        })
    }

    /**
     * 初始化变量
     * 
     * @memberof HotSpot
     */
    [selfMode._initVariable]() {
        let self = this;
        self[selfMode._getParentPosition](self.parent);
        self.container = document.querySelector(self.option.container);

        //判断页面是否存在
        if(!self.container) {
            let createElement = document.createElement('ul');
            createElement.id = self.option.container;
            document.body.appendChild(createElement);
            self.container = createElement;
        }
    }

    /**
     * 给父元素添加鼠标事件
     * 
     * @memberof HotSpot
     */
    [selfMode._initEvent]() {
        let self = this;

        self[selfMode._initMouseEvent]();
        self.container.addEventListener('click', self[selfMode._childClickEvent].bind(self));
        self.parent.addEventListener('click', self[selfMode._closeBtnClickEvent]);
    }

    /**
     * 初始化父容器点击事件
     * 
     * @memberof HotSpot
     */
    [selfMode._initMouseEvent]() {
        let self = this;

        self.parent.addEventListener('mousedown', self[selfMode._mouseDown]);
        self.parent.addEventListener('mousemove', self[selfMode._mouseMove]);
        self.parent.addEventListener('mouseup', self[selfMode._mouseUp]);
    }

    /**
     * 移除父容器点击事件
     * 
     * @memberof HotSpot
     */
    [selfMode._removeMouseEvent]() {
        let self = this;

        console.log('移除事件');

        self.parent.removeEventListener('mousedown', self[selfMode._mouseDown]);
        self.parent.removeEventListener('mousemove', self[selfMode._mouseMove]);
        self.parent.removeEventListener('mouseup', self[selfMode._mouseUp]);
    }

    /**
     * 初始化设置按钮事件
     * 
     * @memberof HotSpot
     */
    [selfMode._initSetting]() {
        let self = this;
        let element = document.createElement('div');

        element.innerHTML = `
            <button class="setting-start" data-type="start">开始</button>
            <button class="setting-end" data-type="stop">暂停</button>
            <button class="setting-output" data-type="output">导出Html</button>
        `

        element.addEventListener('click', self[selfMode._bindSettingEvent].bind(self));
        self.container.appendChild(element);
        self[selfMode._controlBtnStyle](true);
    }

    /**
     * 初始化设置按钮事件
     * 
     * @param {any} e 
     * @memberof HotSpot
     */
    [selfMode._bindSettingEvent](e) {
        let self = this;
        let target = e.target;
        console.log('123')

        if(target.dataset.type == 'start') {
            self.STATUS = 'start';
            self[selfMode._initMouseEvent]();
            self[selfMode._controlBtnStyle](true);
        }else if(target.dataset.type == 'stop') {
            console.log('移除监听事件');
            self[selfMode._removeMouseEvent]();
            self[selfMode._controlBtnStyle](false);
        }else if(target.dataset.type == 'output') {
            self.outputElementJSON().then((res) => {})
        }
    }

    /**
     * 开启和暂停样式
     * 
     * @param {any} open 
     * @memberof HotSpot
     */
    [selfMode._controlBtnStyle](open) {
        let self = this;

        let startBtn = self.container.querySelector('[data-type=start]');
        let stopBtn = self.container.querySelector('[data-type=stop]');

        if(open) {
            startBtn.style.opacity = 0.5;
            stopBtn.style.opacity = 1; 
        }else {
            startBtn.style.opacity = 1;
            stopBtn.style.opacity = 0.5; 
        }
        
    }

    /**
     * 鼠标点击事件
     * 
     * @param {any} e 
     * @memberof HotSpot
     */
    [selfMode._mouseDown](e) {
        let self = this;

        self.STATUS = 'start';
        self.startTime = new Date();
        self[selfMode._getMousePosition](e);
    }

    /**
     * 鼠标移动事件
     * 
     * @param {any} e 
     * @returns 
     * @memberof HotSpot
     */
    [selfMode._mouseMove](e) {
        let self = this;

        if(self.STATUS != 'move') {
            return false;
        }

        self[selfMode._getMousePosition](e);
        let result = self[selfMode._calculateWidthAndHeight]();
        let left = self.nowPos.x - self.startPos.x < 0 ? self.nowPos.x : self.startPos.x;
        let top = self.nowPos.y - self.startPos.y < 0 ? self.nowPos.y : self.startPos.y;    
        let width = Math.abs(result.width); 
        let height = Math.abs(result.height); 

        self.activeChildNode.style.cssText = `
            position: absolute;
            left: ${left}px;
            top: ${top}px;
            width: ${width}px;
            height: ${height}px;
            border: 1px solid #ccc;
        `

        //保存矩形区域信息
        self.rectInfo = { left, top, width, height }
    }

    /**
     * 鼠标放开事件
     * 
     * @memberof HotSpot
     */
    [selfMode._mouseUp](e) {
        let self = this;
        let now = new Date();
        self.STATUS = 'end';

        if(now - 200 < self.startTime) {
            console.log('时间不足');
            self.parent.removeChild(self.activeChildNode);
            return false;
        }
        self[selfMode._createLiElement]();
    }

    /**
     * 子元素生成控制列表点击事件处理
     * 
     * @param {any} e 
     * @memberof HotSpot
     */
    [selfMode._childClickEvent](e) {
        e.stopPropagation();
        let self   = this;
        let target = e.target;
        let hash   = e.target.dataset.hash;

        //判断点击元素类型
        if(target.dataset.type == 'del') {
            self[selfMode._removeRelateNode](hash);
        }else if(target.dataset.type == 'sure') {
            self[selfMode._bindRectangleEvent](target, hash);
        }
    }

    /**
     * 绑定点击事件
     * 
     * @param {any} target
     * @param {any} hash
     * @memberof HotSpot
     */
    [selfMode._bindRectangleEvent](target, hash) {
        let self       = this;
        let parent     = target.parentNode;
        let urlELement = parent.querySelector('[data-url]');
        console.log(urlELement);

        let urlLink = urlELement.value;
        if(!urlLink) {
            alert('还没填写url');
            return false;
        }

        let rect = self[selfMode._findRectangle](hash, true);
        // let dataNode = self.dataNodeList.find((item) => {
        //     return item.hash === hash
        // })

        rect.data.url = urlLink;
        // dataNode.data.url = urlLink; //同步设置data

        // let json = JSON.stringify(self.dataNodeList);
        // localStorage.setItem('data', json);

        rect.element.addEventListener('click', function() {
            location.href = urlLink;
        })
    }

    /**
     * 计算鼠标移动距离
     * 
     * @returns 
     * @memberof HotSpot
     */
    [selfMode._calculateWidthAndHeight]() {
        let self = this;

        let width = self.nowPos.x - self.startPos.x;
        let height = self.nowPos.y - self.startPos.y;
        return { width, height }
    }

    /**
     * 创建子元素
     * 
     * @memberof HotSpot
     */
    [selfMode._createRectangle]() {
        let self    = this;
        let element = document.createElement('div');

        element.style.cssText = `
            position: absolute;
            left: ${self.startPos.x}px;
            top: ${self.startPos.y}px;
            width: 0;
            height: 0;
            border: 1px solid #ccc;
        `

        self.parent.appendChild(element);
        self.activeChildNode = element;
    }

    /**
     * 根据hash值来移除相应的节点
     * 
     * @param {any} hash 
     * @memberof HotSpot
     */
    [selfMode._removeRelateNode](hash) {
        let self = this;

        self[selfMode._removeRectangle](hash);
        self[selfMode._removeLiElement](hash);
        self[selfMode._removeRelateData](hash);
    }

    [selfMode._removeRelateData](hash) {
        let self = this;
        let result = this.childNodeList.filter((item) => {
            return item.hash !== hash
        })

        self.childNodeList = result;
    }

    /**
     * 删除已生成的矩形区域
     * 
     * @param {any} hash
     * @memberof HotSpot
     */
    [selfMode._removeRectangle](hash) {
        let self = this;

        let rect = self[selfMode._findRectangle](hash);
        console.log(rect);
        self.parent.removeChild(rect);
    }

    /**
     * 创建控制元素和保留信息
     * 
     * @memberof HotSpot
     */
    [selfMode._createLiElement]() {
        let self      = this;
        let liElement = document.createElement('li');
        let timeHash  = new Date().getTime().toString();

        liElement.setAttribute('data-hash', timeHash);

        liElement.innerHTML = self[selfMode._getLiElementString](self.childNodeList.length + 1, timeHash)

        //添加删除按钮
        self.activeChildNode.innerHTML =  `
            <span 
                class="${self.option.closeBtnClassName?self.option.closeBtnClassName:'hotspot-close'}" 
                data-hash="${timeHash}"
                style="position: absolute;
                    right: 0;
                    top: 0;
                ">
                ${self.option.closeBtnTextShow?self.option.closeBtnText:''}
            </span>
        `
 
        let childNodeObj = {
            hash: timeHash,
            element: self.activeChildNode,
            data: self.rectInfo
        }

        let dataNodeObj = {
            hash: timeHash,
            data: self.rectInfo
        }

        // self.activeChildNode.addEventListener('click', self[selfMode._closeBtnClickEvent]);
        self.container.appendChild(liElement);
        self.childNodeList.push(childNodeObj);
        // self.dataNodeList.push(dataNodeObj);

        // let json = JSON.stringify(self.dataNodeList);
        // localStorage.setItem('data', json);
    }

    /**
     * 生成元素的点击事件
     * 
     * @param {any} e 
     * @memberof HotSpot
     */
    [selfMode._closeBtnClickEvent](e) {
        let self   = this;
        let target = e.target;

        let hash = target.dataset.hash; 
        if(hash) {
            self[selfMode._removeRelateNode](hash);
        }
    }

    /**
     * 删除控制台生成的对应选项
     * 
     * @param {any} target 
     * @memberof HotSpot
     */
    [selfMode._removeLiElement](hash) {
        let self = this;
        let liResult = self.container.querySelectorAll('li');
        console.log(liResult);
        let target;
        liResult.forEach((item) => {
            console.log(item);
            if(item.dataset.hash === hash) {
                target = item;
            }
        })

        return target?self.container.removeChild(target):false;
    }

    /**
     *  寻找当前选择的区域
     * 
     * @param {any} hash 
     * @param {boolean} type 是否返回对象
     * @returns 
     * @memberof HotSpot
     */
    [selfMode._findRectangle](hash, type) {
        let self = this;
        let filter = self.childNodeList.find((item) => {
            return item.hash === hash;
        })

        //读取历史数据会丢失element元素, 点击寻找并补充
        if(!filter.element) {
            filter.element = self.parent.querySelector("[data-hash='" + hash +"']").parentNode;
        }

        return filter?(type?filter:filter['element']):false;
    }

    /**
     * 获取父元素距离浏览器位置
     * 
     * @param {any} element 
     * @memberof HotSpot
     */
    [selfMode._getParentPosition](element) {
        let self      = this;
        var xPosition = 0;
        var yPosition = 0;

        while(element) {
            xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
            yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
            element = element.offsetParent;
        }

        self.parentPos = {
            xPosition,
            yPosition
        }
    }

    /**
     * 获取当前鼠标位置
     * 
     * @param {any} e 
     * @memberof HotSpot
     */
    [selfMode._getMousePosition](e) {
        let self  = this;
        var ev    = e || window.event; //Moz || IE
        let mouse = {}

        if (ev.pageX) { //Moz
            mouse.x = ev.pageX;
            mouse.y = ev.pageY;
        } else if (ev.clientX) { //IE
            mouse.x = ev.clientX;
            mouse.y = ev.clientY;
        }

        mouse.x -= self.parentPos.xPosition;
        mouse.y -= self.parentPos.yPosition;
        

        if(self.STATUS == 'start') {
            self.startPos = mouse;
            self.STATUS = 'move';
            self[selfMode._createRectangle]();
        }else if(self.STATUS == 'move') {
            self.nowPos = mouse;
        }
        
    }

    /**
     * 获取图片宽度和高度 
     * 
     * @param {any} link
     * @memberof HotSpot
     */
    [selfMode._getImageWidthHeightandSrc]() {
        let self = this;

        return new Promise((resolve, reject) => {
            let image = self.wrapper.querySelector('[data-image]');
            if(image.complete) {
                resolve({
                    width: image.width,
                    height: image.height,
                    src: image.src
                })
                return false;
            }

            image.onload = () => {
                resolve({
                    width: image.width,
                    height: image.height,
                    src: image.src
                })
            }
        })
    }

    /**
     * 返回控制台li字符串
     * 
     * @memberof HotSpot
     */
    [selfMode._getLiElementString](index, hash, url) {
        let self = this;
        let string = self.option.liElementString?self.option.liElementString:`
            <div class="child__node">
                <span class="child__node__text">
                    这是第#index#个区域
                </span>
                <input data-hash='#hash#' value='#url#' type="text" data-url placeholder="输入绑定的url">
                <button data-hash='#hash#' data-type='sure'>确认</button>
                <button data-hash='#hash#' data-type='edit'>编辑</button>
                <button data-hash='#hash#' data-type='del'>删除</button>
            </div>
        `
        console.log(url)
        string = url!='undefined' && url!=''?string.replace(/#url#/, url):string.replace(/#url#/, '');

        return string.replace(/#index#/, index).replace(/#hash#/g, hash)
    }

    /**
     * 解析html上的data数据
     * 
     * @memberof HotSpot
     */
    [selfMode._undecodeHtmlString](string) {
        let result = [];
        try {
            result = string.match(/data-json='(.*?)(?=')/g).map((item) => {
                console.log(item);
                return JSON.parse(item.replace("data-json='", ''));
            });
        }catch(err) {
            console.log(err)
        }
        return result;
    }

    /**
     *  输出区域类型json
     * 
     * @returns 
     * @memberof HotSpot
     */
    outputElementJSON() {
        let self = this;

        return new Promise((resolve, reject) => {
            let result = self.childNodeList;

            let aTagList = [];
            let aTagListString = '';
            let imageW = self.imageInfo.width;
            let imageH = self.imageInfo.height;

            result.forEach((item) => {
                let data = item.data;
                let hash = item.hash;
                let leftPer = parseFloat(data.left/self.imageInfo.width)* 100;
                let topPer = parseFloat(data.top/self.imageInfo.height)* 100;
                let widthPer = parseFloat(data.width/self.imageInfo.width)* 100;
                let heightPer = parseFloat(data.height/self.imageInfo.height)* 100; 

                let aTagString = `
                    <a href="${data.url}" style="position: absolute; left: ${leftPer}%; top: ${topPer}%; width: ${widthPer}%; height: ${heightPer}%; background-color: red" data-json='{ "hash": "${hash}", "data": {"left": ${data.left}, "top": ${data.top}, "width": ${data.width}, "height": ${data.height}, "url": "${data.url}"}}'></a>
                `
                aTagList.push(aTagString);
            })

            aTagListString = aTagList.join('');
            let SectionSrc = self.option.imageSrc?self.option.imageSrc:self.imageInfo.src;

            let createSectionString = `
                <section class="create-pc-hotspot" style="position: relative; display: inline-block; font-size: 0;">
                    <img class="image" alt="" src="${SectionSrc}" width="100%">
                    <div class="hotspot" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                        ${aTagListString}
                    </div>
                </section>
            `

            console.log(createSectionString);
            localStorage.setItem('dataString', createSectionString);
            
            return result?resolve(JSON.stringify(createSectionString)):reject();
        })
        
    }

    /**
     * 根据数据来绘画对象内容
     * 
     * @param {any} data 
     * @param {success} 成功回调方法
     * @param {fail} 失败回调方法
     * @memberof HotSpot
     */
    drawElement({success = '', fail = ''} = {}) {
        let self = this;
        let htmlString = localStorage.getItem('dataString');
        //let dataList = JSON.parse(localStorage.getItem('data'));
        let eleTotal = '';
        let rectTotal = '';

        let dataList = self[selfMode._undecodeHtmlString](htmlString);
        //self.dataNodeList = dataList;
        if(dataList.length == 0) {
            return fail?fail('不存在数据'):false;
        }

        try {
            dataList.forEach((item, index) => {
                self.childNodeList.push(item);
                console.log(item);
                
                let element = self[selfMode._getLiElementString](index + 1, item.hash, item.data.url);
                let li = `<li data-hash=${item.hash}>${element}</li>`;
    
                //拼接控制台li元素
                eleTotal += li;
    
                //矩形区域
                let data = item.data;
                let rect = `
                    <div style="position:absolute;
                        left: ${data.left}px;
                        top: ${data.top}px;
                        width: ${data.width}px;
                        height: ${data.height}px;
                        border: 1px solid #ccc;">
                        <span 
                            class="${self.option.closeBtnClassName?self.option.closeBtnClassName:'hotspot-close'}" 
                            data-hash="${item.hash}"
                            style="position: absolute;
                                right: 0;
                                top: 0;
                            ">
                            ${self.option.closeBtnTextShow?self.option.closeBtnText:''}
                        </span>
                    </div>
                `
                rectTotal += rect;
            })
            
            self.parent.insertAdjacentHTML('beforeend', rectTotal);
            self.container.insertAdjacentHTML('beforeend', eleTotal);
        }catch (err) {
            return fail?fail(err):false;
        }
        
        return success?success():false;
    }
}

window.HotSpot = new HotSpot(document.querySelector('#canvas'), {
    imageSrc: './src/image/dem-academy-small.png'
});