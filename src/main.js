import './style.scss'

class HotSpot {
    constructor(wrapper, option) {
        console.log(parent);
        this.wrapper         = wrapper; //包裹元素
        this.parent          = parent; //绑定的父元素
        this.parentPos       = {}; //父元素位置
        this.container       = null; //控制面板输出容器

        this.option          =  {
                                   container: 'list', //容器id
                                   clickResponse: 200, //创建容器反应时间
                                }
        this.startPos        = {};//开始绘制的位置
        this.nowPos          = {}; //目前的鼠标位置
        this.rectInfo        = {};

        this.startTime       = null;
        this.endTime         = null;
        this.activeChildNode = null; //激活的子元素
        this.childNodeList   = []; //选择的元素
        this.STATUS          = '';

        this.option          = Object.assign(this.option, option);
        this._mouseDown      = this._mouseDown.bind(this);
        this._mouseMove      = this._mouseMove.bind(this);
        this._mouseUp        = this._mouseUp.bind(this);

        //初始化
        this._initParent();
    }

    /**
     * 初始化元素
     * 
     * @memberof HotSpot
     */
    _initParent() {
        this._getImageWidthAndHeight().then((res) => {
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
            this.wrapper.appendChild(parent);
            this.parent = parent;
            this._initVariable();
            this._initEvent();
            this._initSetting();
        })
    }

    /**
     * 初始化变量
     * 
     * @memberof HotSpot
     */
    _initVariable() {
        this._getParentPosition(this.parent);
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
    _initEvent() {
        this._initMouseEvent();
        this.container.addEventListener('click', this._childClickEvent.bind(this));
    }

    /**
     * 初始化父容器点击事件
     * 
     * @memberof HotSpot
     */
    _initMouseEvent() {
        console.log('添加事件');
        this.parent.addEventListener('mousedown', this._mouseDown);
        this.parent.addEventListener('mousemove', this._mouseMove);
        this.parent.addEventListener('mouseup', this._mouseUp);
    }

    /**
     * 移除父容器点击事件
     * 
     * @memberof HotSpot
     */
    _removeMouseEvent() {
        console.log('移除事件');
        this.parent.removeEventListener('mousedown', this._mouseDown);
        this.parent.removeEventListener('mousemove', this._mouseMove);
        this.parent.removeEventListener('mouseup', this._mouseUp);
    }

    /**
     * 初始化设置按钮事件
     * 
     * @memberof HotSpot
     */
    _initSetting() {
        let element = document.createElement('div');
        element.innerHTML = `
            <button class="setting-start" data-type="start">开始</button>
            <button class="setting-end" data-type="stop">暂停</button>
            <button class="setting-output" data-type="output">导出json</button>
            <button class="setting-create" data-type="create">生成区域</button>
        `

        element.addEventListener('click', this._bindSettingEvent.bind(this));
        this.container.appendChild(element);
    }

    /**
     * 初始化设置按钮事件
     * 
     * @param {any} e 
     * @memberof HotSpot
     */
    _bindSettingEvent(e) {
        let target = e.target;
        if(target.dataset.type == 'start') {
            this.STATUS = 'start';
            this._initMouseEvent();
        }else if(target.dataset.type == 'stop') {
            console.log('移除监听事件');
            this._removeMouseEvent();
        }
    }

    /**
     * 鼠标点击事件
     * 
     * @param {any} e 
     * @memberof HotSpot
     */
    _mouseDown(e) {
        this.STATUS = 'start';
        this.startTime = new Date();
        this._getMousePosition(e);
    }

    /**
     * 鼠标移动事件
     * 
     * @param {any} e 
     * @returns 
     * @memberof HotSpot
     */
    _mouseMove(e) {
        if(this.STATUS != 'move') {
            return false;
        }

        this._getMousePosition(e);
        let result = this._calculateWidthAndHeight();
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
    _mouseUp(e) {
        let now = new Date();
        this.STATUS = 'end';

        if(now - 200 < this.startTime) {
            console.log('时间不足');
            this.parent.removeChild(this.activeChildNode);
            return false;
        }
        this._createLiElement();
    }

    /**
     * 子元素生成控制列表点击事件处理
     * 
     * @param {any} e 
     * @memberof HotSpot
     */
    _childClickEvent(e) {
        e.stopPropagation();
        console.log(e);
        let target = e.target;
        let hash   = e.target.dataset.hash;

        //判断点击元素类型
        if(target.dataset.type == 'del') {
            this._removeRectangle(hash);
            this._removeLiElement(target);
        }else if(target.dataset.type == 'sure') {
            this._bindRectangleEvent(target, hash);
        }
    }

    /**
     * 绑定点击事件
     * 
     * @param {any} target
     * @param {any} hash
     * @memberof HotSpot
     */
    _bindRectangleEvent(target, hash) {
        let parent     = target.parentNode;
        let urlELement = parent.querySelector('[data-url]');
        console.log(urlELement);

        let urlLink = urlELement.value;
        if(!urlLink) {
            alert('还没填写url');
            return false;
        }

        let rect = this._findRectangle(hash, true);
        console.log(rect);
        rect.data.url = urlLink;

        rect.element.addEventListener('click', function() {
            location.href = urlLink;
        })
    }

    _bindRectangleClick() {

    }

    /**
     * 计算鼠标移动距离
     * 
     * @returns 
     * @memberof HotSpot
     */
    _calculateWidthAndHeight() {
        let width = this.nowPos.x - this.startPos.x;
        let height = this.nowPos.y - this.startPos.y;
        return { width, height }
    }

    /**
     * 创建子元素
     * 
     * @memberof HotSpot
     */
    _createRectangle() {
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
     * 删除已生成的矩形区域
     * 
     * @param {any} hash
     * @memberof HotSpot
     */
    _removeRectangle(hash) {
        let rect = this._findRectangle(hash);
        this.parent.removeChild(rect);
    }

    /**
     * 创建控制元素和保留信息
     * 
     * @memberof HotSpot
     */
    _createLiElement() {
        let liElement = document.createElement('li');
        let timeHash = new Date().getTime().toString();
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
 
        let childNodeObj = {
            hash: timeHash,
            element: this.activeChildNode,
            data: this.rectInfo
        }

        this.container.appendChild(liElement);
        this.childNodeList.push(childNodeObj);
        console.log(this.childNodeList);
    }

    /**
     * 删除控制台生成的对应选项
     * 
     * @param {any} target 
     * @memberof HotSpot
     */
    _removeLiElement(target) {
        let parent = this._findParent('li', target);
        this.container.removeChild(parent);
    }

    /**
     * 寻找父元素
     * 
     * @param {any} tagName 
     * @param {any} el 
     * @returns 
     * @memberof HotSpot
     */
    _findParent(tagName, el) {
        try {
            el = target.closest('li');
        }catch (err) {
            while (el && el.tagName !== tagName.toUpperCase()) {
                el = el.parentNode;
            }
        }
        
        return el;
    }

    /**
     * 获取临近元素
     * 
     * @param {any} filter 
     * @param {any} el 
     * @returns 
     * @memberof HotSpot
     */
    _findNearElement(filter, el) {
        let result = el.querySelector(filter);

        return result;
    }

    /**
     *  寻找当前选择的区域
     * 
     * @param {any} hash 
     * @param {boolean} type 是否返回对象
     * @returns 
     * @memberof HotSpot
     */
    _findRectangle(hash, type) {
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
    _getParentPosition(element) {
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
    _getMousePosition(e) {
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
            this._createRectangle();
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
    _getImageWidthAndHeight() {
        return new Promise((resolve, reject) => {
            let image = this.wrapper.querySelector('[data-image]');
            if(image.complete) {
                resolve({
                    width: image.width,
                    height: image.height
                })
                return false;
            }

            image.onload = () => {
                resolve({
                    width: image.width,
                    height: image.height
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

            this._removeMouseEvent();
        })
    }
}

window.HotSpot = new HotSpot(document.querySelector('#canvas'));