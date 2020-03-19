(function(){
	var Game = window.Game = function(params){
		this.canvas = document.getElementById(params.id);
		this.ctx = this.canvas.getContext("2d");
		this.resourcePath = params.resourcePath;
		//帧
		this.FNO = 0;
		//combo数值
		this.combo = 0;
		//最后一次消除的帧编号
		this.lastEliminate = 0;
		//分数
		this.score = 0;
		//状态机
		this.fsm = "B"; // A--静稳状态  B--检查是否能够消除 C--消除 D--下落  E--补充新的
		this.callbacks = {
			
		};//回调函数jSON，每个key都是帧编号，代表在这个帧需要执行的函数
		this.init();
		var self = this;

		this.loadAllResources(function(){
			self.start();
			//绑定监听
			self.bindEvent();
		});
	}
	Game.prototype.start = function(){
		this.FNO = 0;
		var self = this;
		//实例化精灵
		this.map = new Map();

		//播放音乐
		this.Musics["bgm"].loop = true;
		this.Musics["bgm"].play();

		setInterval(function(){
			self.FNO ++;
			self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
			//画背景
			self.ctx.drawImage(self.Images["bg1"],0,0,self.canvas.width,self.canvas.height);
			//打印标题
			self.ctx.drawImage(self.Images["logo"],(self.canvas.width - 531 / 2) / 2,0,531 / 2,392 / 2);

			//画精灵
			self.map.render();

			//检查帧编号是否符合回调中的帧，如果有，就执行里面的函数
			if(self.callbacks.hasOwnProperty(self.FNO.toString())){
				//执行里面的函数
				typeof self.callbacks[self.FNO.toString()] === "function" && self.callbacks[self.FNO.toString()]();
				//清除这条函数
				delete self.callbacks[self.FNO.toString()];
			}

			//根据状态机状态决定做什么事情
			switch(self.fsm){
				case "A":
					break;
				case "B":
					//检查是否能够消除，能，则进入状态C，不能则进入状态A
					if(self.map.check().length != 0){
						self.fsm = "C";
					} else {
						self.fsm = "A";
					}
					break;
				case "C":
					//消除精灵，并补充新精灵
					self.map.eliminate();
					//修改此时的状态为动画状态，防止动画积累
					self.fsm = "动画状态";
					self.registCallback(14,function(){
						self.fsm = "D";
					})
					break;
				case "D":
					self.map.dropdown();
					self.fsm = "动画状态";
					self.registCallback(20,function(){
						self.fsm = "E";
					})
					break;
				case "E":
					self.map.supply();
					self.fsm = "动画状态";
					self.registCallback(25,function(){
						self.fsm = "B";
					})
					break;
			}
			
			self.ctx.fillStyle = "rgba(0,0,0,.5)";
			self.ctx.fillRect(self.leftPadding,self.top,(self.spritewh + 4) * 7,(self.spritewh + 4) * 7);
			//打印帧编号
			self.ctx.textAlign = "left";
			self.ctx.font = "16px consolas";
			self.ctx.fillStyle = "red";
			self.ctx.fillText("FNO:" + self.FNO,10,20);
			self.ctx.fillText("FSM:" + self.fsm,10,40);
			self.ctx.fillText("combo:" + self.combo,10,60);
			self.ctx.fillText("score:" + self.score,10,80);
		},20)
	}
	//初始化，设置画布的宽度和高度
	Game.prototype.init = function(){
		//读取视口的宽度和高度，
		var windowW = document.documentElement.clientWidth;
		var windowH = document.documentElement.clientHeight;
		//验收
		if(windowW > 414){
			windowW = 414;
		}else if(windowW < 320){
			windowW = 320;
		}
		if(windowH > 736){
			windowH = 736;
		}else if(windowH < 500){
			windowH = 500;
		}
		//让canvas匹配视口
		this.canvas.width = windowW;
		this.canvas.height = windowH;

		this.leftPadding = 20;
		this.bottom = 100;
		this.spritewh = (this.canvas.width - this.leftPadding * 2) / 7 - 4;
		this.top = this.canvas.height - this.bottom - (this.spritewh + 4) * 7;
	}
	//注册回调函数,frame帧后，才执行该函数
	Game.prototype.registCallback = function(frame,fn){
		this.callbacks[this.FNO + frame] = fn;
	}
	//读取资源
	Game.prototype.loadAllResources = function(callback) {
		var self = this;
		//图片资源
		this.Images = {};
		//音乐资源
		this.Musics = {};
		var allReadyNum = 0; //已经加载好的资源数量
		var xhr = new XMLHttpRequest();
		//读取R.json文件
		xhr.onreadystatechange = function(){
			if(xhr.readyState == 4){
				var Robj = JSON.parse(xhr.responseText);
				for(var i = 0 ; i < Robj["images"].length ; i ++){
					self.Images[Robj["images"][i]["name"]] = new Image();
					self.Images[Robj["images"][i]["name"]].src = Robj["images"][i].url;
					//加载图片资源
					self.Images[Robj["images"][i]["name"]].onload = function(){
						allReadyNum ++;
						//清屏
						self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
						//提示文字
						var txt = "正在加载资源" + allReadyNum + "/" + Robj.images.length + "请稍后";
						//放置居中的位置，屏幕的黄金分割点
						self.ctx.textAlign = "center";
						self.ctx.font = "20px 微软雅黑";
						self.ctx.fillText(txt, self.canvas.width / 2 ,self.canvas.height * (1 - 0.618));
						if(allReadyNum == Robj["images"].length){
							//图片文件读取完毕
							callback && callback();
						}
					}
				}
				for (var i = 0; i < Robj.music.length; i++) {
					//创建一个同名的key
					self.Musics[Robj.music[i].name] = document.createElement("audio");
					//请求
					self.Musics[Robj.music[i].name].src = Robj.music[i].url;
				}
			}
		}
		xhr.open("get",this.resourcePath,true);
		xhr.send(null);
	};

	Game.prototype.bindEvent = function(){
		var self = this;

		this.canvas.onmousedown = function(event){
			if(self.fsm != "A"){
				return;
			}

			var startCol = parseInt(event.offsetX / (self.spritewh + 4));

			var startRow = parseInt((event.offsetY - self.top) /  (self.spritewh + 4));
			
			if(startRow < 0 || startRow > 6 || startCol < 0 || startCol > 6){
				return;
			}
			console.log("start",startRow,startCol);

			self.canvas.onmousemove = function(event){
				var endCol = parseInt(event.offsetX / (self.spritewh + 4));
				var endRow =  parseInt((event.offsetY - self.top) /  (self.spritewh + 4));
				if(endRow < 0 || endRow > 6 || endCol < 0 || endCol > 6){
					return;
				}
				if((endRow != startRow && endCol != startCol) || (endRow == startRow && endCol == startCol)){
					return;
				}
				//清除mousemove事件
				self.canvas.onmousemove = null;
				console.log("end",endRow,endCol);
				self.map.exchange(startRow,startCol,endRow,endCol);
			}
		}
	}
})();