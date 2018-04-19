import './style.scss'

class HotSpot {
    constructor(parent, option) {
        console.log(parent);
        this.parent          = parent; //绑定的父元素
        this.parentPos       = {}; //父元素位置
        this.container       = null; //控制面板输出容器

        this.option          = Object.assign({
                                   container: 'list' //容器id
                               }, option); 
        this.startPos        = {};//开始绘制的位置
        this.nowPos          = {}; //目前的鼠标位置
        this.activeChildNode = null; //激活的子元素
        this.childNodeList   = []; //选择的元素
        this.STATUS          = '';

        this._init();
    }

    _init() {
        this._initVariable();
        this._initEvent();
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
        this.parent.addEventListener('mousedown', this._mouseDown.bind(this));
        this.parent.addEventListener('mousemove', this._mouseMove.bind(this));
        this.parent.addEventListener('mouseup', this._mouseUp.bind(this));

        this.container.addEventListener('click', this._childClickEvent.bind(this));
    }

    /**
     * 鼠标点击事件
     * 
     * @param {any} e 
     * @memberof HotSpot
     */
    _mouseDown(e) {
        this.STATUS = 'start';
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
        
        this.activeChildNode.style.cssText = `
            position: absolute;
            left: ${this.nowPos.x - this.startPos.x < 0 ? this.nowPos.x : this.startPos.x}px;
            top: ${this.nowPos.y - this.startPos.y < 0 ? this.nowPos.y : this.startPos.y}px;
            width: ${Math.abs(result.width)}px;
            height: ${Math.abs(result.height)}px;
            border: 1px solid #ccc;
        `
    }

    /**
     * 鼠标放开事件
     * 
     * @memberof HotSpot
     */
    _mouseUp(e) {
        this.STATUS = 'end';
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
            this._bindRectangleEvent(target);
        }
    }

    /**
     * 绑定点击事件
     * 
     * @param {any} filter 
     * @memberof HotSpot
     */
    _bindRectangleEvent(target) {
        let parent     = target.parentNode;
        let urlELement = parent.querySelector('[data-url]');
        console.log(urlELement);

        let urlLink = urlELement.value;
        if(!urlLink) {
            alert('还没填写url');
            return false;
        }

        
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
        return {
            width,
            height
        }
    }

    /**
     * 创建子元素
     * 
     * @memberof HotSpot
     */
    _createRectangle() {
        let element = document.createElement('div');
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

        element.style.cssText = `
            position: absolute;
            left: ${this.startPos.x}px;
            top: ${this.startPos.y}px;
            width: 0;
            height: 0;
            border: 1px solid #ccc;
        `

        let childNodeObj = {
            hash: timeHash,
            element
        }

        this.parent.appendChild(element);
        this.container.appendChild(liElement);
        this.childNodeList.push(childNodeObj);
        this.activeChildNode = element;
    }

    /**
     * 删除已生成的矩形区域
     * 
     * @param {any} filter 
     * @memberof HotSpot
     */
    _removeRectangle(hash) {
        let filter = this.childNodeList.find((item) => {
            return item.hash === hash;
        })

        this.parent.removeChild(filter['element'])
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
}

new HotSpot(document.querySelector('#canvas'))