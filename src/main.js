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
 *                  closeBtnTextShow: 默认true
 *              }
 * @class HotSpot
 */
class HotSpot {
    constructor(wrapper, option) {
        //容器
        this.wrapper         = wrapper; //包裹元素
        this.parentPos       = {}; //父元素位置
        this.parent          = null; //绑定的父元素
        this.container       = null; //控制面板输出容器
        this.activeChildNode = null; //激活的子元素

        //选项
        this.option          =  {
                                   container: 'list', //容器id
                                   clickResponse: 200, //创建容器反应时间
                                   closeBtnText: '关闭',
                                   closeBtnTextShow: true
                                }
        
        //鼠标事件
        this.startPos        = {};//开始绘制的位置
        this.nowPos          = {}; //目前的鼠标位置
        this.startTime       = null; //开始绘制的时间
        this.endTime         = null; //结束绘制的时间
        this.STATUS          = '';

        //绘制元素记录信息
        this.imageInfo       = {}; //图片记录信息(宽高/链接)
        this.rectInfo        = {}; //绘制成功区域数据

        //已绘制的区域集合信息
        this.childNodeList   = []; 

        //集合用户配置的信息
        this.option          = Object.assign(this.option, option);

        //绑定当前thiz指向
        this[selfMode._mouseDown]          = this[selfMode._mouseDown].bind(this);
        this[selfMode._mouseMove]          = this[selfMode._mouseMove].bind(this);
        this[selfMode._mouseUp]            = this[selfMode._mouseUp].bind(this);
        this[selfMode._closeBtnClickEvent] = this[selfMode._closeBtnClickEvent].bind(this);

        //初始化
        this[selfMode._initParent]();
    }

    /**
     * 初始化元素
     * 
     * @memberof HotSpot
     */
    [selfMode._initParent]() {
        this[selfMode._getImageWidthHeightandSrc]().then((res) => {
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

            this.imageInfo = res;
            this.wrapper.appendChild(parent);
            this.parent = parent;
            this[selfMode._initVariable]();
            this[selfMode._initEvent]();
            this[selfMode._initSetting]();
        })
    }

    /**
     * 初始化变量
     * 
     * @memberof HotSpot
     */
    [selfMode._initVariable]() {
        this[selfMode._getParentPosition](this.parent);
        this.container = document.querySelector(this.option.container);

        //判断页面是否存在
        if(!this.container) {
            let createElement = document.createElement('ul');
            createElement.id = this.option.container;
            document.body.appendChild(createElement);
            this.container = createElement;
        }
    }

    /**
     * 给父元素添加鼠标事件
     * 
     * @memberof HotSpot
     */
    [selfMode._initEvent]() {
        this[selfMode._initMouseEvent]();
        this.container.addEventListener('click', this[selfMode._childClickEvent].bind(this));
    }

    /**
     * 初始化父容器点击事件
     * 
     * @memberof HotSpot
     */
    [selfMode._initMouseEvent]() {
        console.log('添加事件');
        this.parent.addEventListener('mousedown', this[selfMode._mouseDown]);
        this.parent.addEventListener('mousemove', this[selfMode._mouseMove]);
        this.parent.addEventListener('mouseup', this[selfMode._mouseUp]);
    }

    /**
     * 移除父容器点击事件
     * 
     * @memberof HotSpot
     */
    [selfMode._removeMouseEvent]() {
        console.log('移除事件');
        this.parent.removeEventListener('mousedown', this[selfMode._mouseDown]);
        this.parent.removeEventListener('mousemove', this[selfMode._mouseMove]);
        this.parent.removeEventListener('mouseup', this[selfMode._mouseUp]);
    }

    /**
     * 初始化设置按钮事件
     * 
     * @memberof HotSpot
     */
    [selfMode._initSetting]() {
        let element = document.createElement('div');
        element.innerHTML = `
            <button class="setting-start" data-type="start">开始</button>
            <button class="setting-end" data-type="stop">暂停</button>
            <button class="setting-output" data-type="output">导出Html</button>
        `

        element.addEventListener('click', this[selfMode._bindSettingEvent].bind(this));
        this.container.appendChild(element);
        this[selfMode._controlBtnStyle](true);
    }

    /**
     * 初始化设置按钮事件
     * 
     * @param {any} e 
     * @memberof HotSpot
     */
    [selfMode._bindSettingEvent](e) {
        let target = e.target;
        console.log(e);
        if(target.dataset.type == 'start') {
            this.STATUS = 'start';
            this[selfMode._initMouseEvent]();
            this[selfMode._controlBtnStyle](true);
        }else if(target.dataset.type == 'stop') {
            console.log('移除监听事件');
            this[selfMode._removeMouseEvent]();
            this[selfMode._controlBtnStyle](false);
        }else if(target.dataset.type == 'output') {
            this.outputElementJSON().then((res) => {})
        }
    }

    /**
     * 开启和暂停样式
     * 
     * @param {any} open 
     * @memberof HotSpot
     */
    [selfMode._controlBtnStyle](open) {
        let startBtn = this.container.querySelector('[data-type=start]');
        let stopBtn = this.container.querySelector('[data-type=stop]');

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
        this.STATUS = 'start';
        this.startTime = new Date();
        this[selfMode._getMousePosition](e);
    }

    /**
     * 鼠标移动事件
     * 
     * @param {any} e 
     * @returns 
     * @memberof HotSpot
     */
    [selfMode._mouseMove](e) {
        if(this.STATUS != 'move') {
            return false;
        }

        this[selfMode._getMousePosition](e);
        let result = this[selfMode._calculateWidthAndHeight]();
        let left = this.nowPos.x - this.startPos.x < 0 ? this.nowPos.x : this.startPos.x;
        let top = this.nowPos.y - this.startPos.y < 0 ? this.nowPos.y : this.startPos.y;    
        let width = Math.abs(result.width); 
        let height = Math.abs(result.height); 

        this.activeChildNode.style.cssText = `
            position: absolute;
            left: ${left}px;
            top: ${top}px;
            width: ${width}px;
            height: ${height}px;
            border: 1px solid #ccc;
        `

        //保存矩形区域信息
        this.rectInfo = { left, top, width, height }
    }

    /**
     * 鼠标放开事件
     * 
     * @memberof HotSpot
     */
    [selfMode._mouseUp](e) {
        let now = new Date();
        this.STATUS = 'end';

        if(now - 200 < this.startTime) {
            console.log('时间不足');
            this.parent.removeChild(this.activeChildNode);
            return false;
        }
        this[selfMode._createLiElement]();
    }

    /**
     * 子元素生成控制列表点击事件处理
     * 
     * @param {any} e 
     * @memberof HotSpot
     */
    [selfMode._childClickEvent](e) {
        e.stopPropagation();
        console.log(e);
        let target = e.target;
        let hash   = e.target.dataset.hash;

        //判断点击元素类型
        if(target.dataset.type == 'del') {
            this[selfMode._removeRelateNode](hash);
        }else if(target.dataset.type == 'sure') {
            this[selfMode._bindRectangleEvent](target, hash);
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
        let parent     = target.parentNode;
        let urlELement = parent.querySelector('[data-url]');
        console.log(urlELement);

        let urlLink = urlELement.value;
        if(!urlLink) {
            alert('还没填写url');
            return false;
        }

        let rect = this[selfMode._findRectangle](hash, true);
        console.log(rect);
        rect.data.url = urlLink;

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
        let width = this.nowPos.x - this.startPos.x;
        let height = this.nowPos.y - this.startPos.y;
        return { width, height }
    }

    /**
     * 创建子元素
     * 
     * @memberof HotSpot
     */
    [selfMode._createRectangle]() {
        let element = document.createElement('div');
        

        element.style.cssText = `
            position: absolute;
            left: ${this.startPos.x}px;
            top: ${this.startPos.y}px;
            width: 0;
            height: 0;
            border: 1px solid #ccc;
        `

        this.parent.appendChild(element);
        this.activeChildNode = element;
    }

    /**
     * 根据hash值来移除相应的节点
     * 
     * @param {any} hash 
     * @memberof HotSpot
     */
    [selfMode._removeRelateNode](hash) {
        this[selfMode._removeRectangle](hash);
        this[selfMode._removeLiElement](hash);
        this[selfMode._removeRelateData](hash);
    }

    [selfMode._removeRelateData](hash) {
        let result = this.childNodeList.filter((item) => {
            return item.hash !== hash
        })

        this.childNodeList = result;
    }

    /**
     * 删除已生成的矩形区域
     * 
     * @param {any} hash
     * @memberof HotSpot
     */
    [selfMode._removeRectangle](hash) {
        let rect = this[selfMode._findRectangle](hash);
        this.parent.removeChild(rect);
    }

    /**
     * 创建控制元素和保留信息
     * 
     * @memberof HotSpot
     */
    [selfMode._createLiElement]() {
        let liElement = document.createElement('li');
        let timeHash = new Date().getTime().toString();
        liElement.setAttribute('data-hash', timeHash);
        liElement.innerHTML = `
            <div class="child__node">
                <span class="child__node__text">
                    这是第${this.childNodeList.length + 1}个区域
                </span>
                <input type="text" data-url placeholder="输入绑定的url">
                <button data-hash='${timeHash}' data-type='sure'>确认</button>
                <button data-hash='${timeHash}' data-type='edit'>编辑</button>
                <button data-hash='${timeHash}' data-type='del'>删除</button>
            </div>
        `

        //添加删除按钮
        this.activeChildNode.innerHTML =  `
            <span 
                class="${this.option.closeBtnClassName?this.option.closeBtnClassName:'hotspot-close'}" 
                data-hash="${timeHash}"
                style="position: absolute;
                    right: 0;
                    top: 0;
                ">
                ${this.option.closeBtnTextShow?this.option.closeBtnText:''}
            </span>
        `
 
        let childNodeObj = {
            hash: timeHash,
            element: this.activeChildNode,
            data: this.rectInfo
        }

        this.activeChildNode.addEventListener('click', this[selfMode._closeBtnClickEvent]);
        this.container.appendChild(liElement);
        this.childNodeList.push(childNodeObj);
    }

    /**
     * 生成元素的点击事件
     * 
     * @param {any} e 
     * @memberof HotSpot
     */
    [selfMode._closeBtnClickEvent](e) {
        let target = e.target;
        console.log('click');
        let hash = target.dataset.hash; 
        if(hash) {
            this[selfMode._removeRelateNode](hash);
        }
    }

    /**
     * 删除控制台生成的对应选项
     * 
     * @param {any} target 
     * @memberof HotSpot
     */
    [selfMode._removeLiElement](hash) {
        let liResult = this.container.querySelectorAll('li');
        let target;
        liResult.forEach((item) => {
            console.log(item);
            if(item.dataset.hash === hash) {
                target = item;
            }
        })

        target?this.container.removeChild(target):false;
        // let parent = this._findParent('li', target);
        // this.container.removeChild(parent);
    }

    // /**
    //  * 寻找父元素
    //  * 
    //  * @param {any} tagName 
    //  * @param {any} el 
    //  * @returns 
    //  * @memberof HotSpot
    //  */
    // _findParent(tagName, el) {
    //     try {
    //         el = target.closest('li');
    //     }catch (err) {
    //         while (el && el.tagName !== tagName.toUpperCase()) {
    //             el = el.parentNode;
    //         }
    //     }
        
    //     return el;
    // }

    // /**
    //  * 获取临近元素
    //  * 
    //  * @param {any} filter 
    //  * @param {any} el 
    //  * @returns 
    //  * @memberof HotSpot
    //  */
    // _findNearElement(filter, el) {
    //     let result = el.querySelector(filter);

    //     return result;
    // }

    /**
     *  寻找当前选择的区域
     * 
     * @param {any} hash 
     * @param {boolean} type 是否返回对象
     * @returns 
     * @memberof HotSpot
     */
    [selfMode._findRectangle](hash, type) {
        let filter = this.childNodeList.find((item) => {
            return item.hash === hash;
        })

        if(filter) {
            return type?filter:filter['element'];
        }else {
            return false;
        }
    }

    /**
     * 获取父元素距离浏览器位置
     * 
     * @param {any} element 
     * @memberof HotSpot
     */
    [selfMode._getParentPosition](element) {
        var xPosition = 0;
        var yPosition = 0;

        while(element) {
            xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
            yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
            element = element.offsetParent;
        }

        this.parentPos = {
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
        var ev = e || window.event; //Moz || IE
        let mouse = {}
        if (ev.pageX) { //Moz
            mouse.x = ev.pageX + window.pageXOffset;
            mouse.y = ev.pageY + window.pageYOffset;
        } else if (ev.clientX) { //IE
            mouse.x = ev.clientX + document.body.scrollLeft;
            mouse.y = ev.clientY + document.body.scrollTop;
        }

        mouse.x -= this.parentPos.xPosition;
        mouse.y -= this.parentPos.yPosition;

        if(this.STATUS == 'start') {
            this.startPos = mouse;
            this.STATUS = 'move';
            this[selfMode._createRectangle]();
        }else if(this.STATUS == 'move') {
            this.nowPos = mouse;
        }
        
    }

    /**
     * 获取图片宽度和高度 
     * 
     * @param {any} link
     * @memberof HotSpot
     */
    [selfMode._getImageWidthHeightandSrc]() {
        return new Promise((resolve, reject) => {
            let image = this.wrapper.querySelector('[data-image]');
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
     *  输出区域类型json
     * 
     * @returns 
     * @memberof HotSpot
     */
    outputElementJSON() {
        return new Promise((resolve, reject) => {
            let result = this.childNodeList.map((element) => {
                return element.data;
            })

            let aTagList = [];
            let aTagListString = '';

            result.forEach((item) => {
                let aTagString = `
                    <a href="${item.url}" style="position: absolute; left: ${item.left}px; top: ${item.top}px; width: ${item.width}px; height: ${item.height}px; background-color: blue"></a>
                `
                aTagList.push(aTagString);
            })

            aTagListString = aTagList.join('');
            let SectionSrc = this.option.imageSrc?this.option.imageSrc:this.imageInfo.src;

            let createSectionString = `
                <section class="create-pc-hotspot" style="position: relative; display: inline-block; font-size: 0;">
                    <img class="image" alt="" src="${SectionSrc}">
                    <div class="hotspot" style="position: absolute; top: 0; left: 0; width: ${this.imageInfo.width}px; height: ${this.imageInfo.height}px;">
                        ${aTagListString}
                    </div>
                </section>
            `

            alert(createSectionString);
    
            if(result) {
                resolve(JSON.stringify(result));
            }else {
                reject()
            }
        })
        
    }

    /**
     * 根据数据来绘画对象内容
     * 
     * @param {any} data 
     * @memberof HotSpot
     */
    drawElement(data) {
        return new Promise((resolve, reject) => {
            let dataList;
            if(typeof data == 'string') {
                dataList = JSON.parse(data);
            }else if(typeof data == 'object') {
                dataList = data;
            }else {
                throw Error('无传参，或者参数类型错误!')
            }

            dataList.forEach(element => {
                let divElement = document.createElement('div');
                divElement.style.cssText = `
                    position: absolute;
                    left: ${element.left}px;
                    top: ${element.top}px;
                    width: ${element.width}px;
                    height: ${element.height}px;
                    border: 1px solid #ccc;
                `

                this.parent.appendChild(divElement);

                if(element.url) {
                    divElement.addEventListener('click', function() {
                        location.href = element.url;
                    })
                }
            });

            this[selfMode._removeMouseEvent]();
        })
    }

    test() {
        console.log(this);
    }
}

window.HotSpot = new HotSpot(document.querySelector('#canvas'), {
    imageSrc: './src/image/sweden-bottom-bg.png'
});

const privateMethod = Symbol('privateMethod');
class Service {
    constructor () {
      this.say = "Hello";
    }
    
    [privateMethod] () {
      console.log(this.say);
    }
    
    publicMethod () {
      this[privateMethod]()
    }
}