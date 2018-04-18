import './style.scss'

class HotSpot {
    constructor(parent, option) {
        console.log(parent);
        this.parent          = parent; //绑定的父元素
        this.parentPos       = {}; //父元素位置
        this.option          = option; 
        this.startPos        = {};//开始绘制的位置
        this.nowPos          = {}; //目前的鼠标位置
        this.activeChildNode = null; //激活的子元素
        this.STATUS          = '';

        this._init();
        this._getParentPosition(this.parent);
    }

    _init() {
        this._initEvent();
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
        console.log(result);
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
    _mouseUp() {
        this.STATUS = 'end';
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