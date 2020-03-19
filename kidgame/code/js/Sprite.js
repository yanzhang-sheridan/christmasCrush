(function(){
	//row:0-6 行号;col:0-6列号;type:0-7精灵类型
	var Sprite = window.Sprite = function(row,col,imageName){
		this.row = row;
		this.col = col;
		this.imageName = imageName;
		this.isMove = false;//精灵是否在运动
		this.moveNo = 0; //判断运动是否要停止
		this.isBomb = false;//判断精灵是否爆炸
		this.bombStep = 8; //爆炸步骤，一共8张图片
		this.isHide = false;//精灵是否隐藏，一般爆炸后，就要隐藏


		//定位左下方精灵位置
		var bottom = 200,leftPadding = 20;
		this.spritewh = calXYByRowCol(this.row,this.col).spritewh;
		//精灵的左侧位置
		this.spriteX = calXYByRowCol(this.row,this.col).spriteX;
		//距离顶部距离
		this.spriteY = calXYByRowCol(this.row,this.col).spriteY;
		
	}
	Sprite.prototype.render = function(){
		//如果需要隐藏，则什么都不渲染
		if(this.isHide){
			return;
		}
		if(!this.isBomb){
			game.ctx.drawImage(game.Images[this.imageName],this.spriteX,this.spriteY, this.spritewh , this.spritewh);
		} else {
			game.ctx.drawImage(game.Images["bomb"],(8-this.bombStep) * 200,0,200,200,this.spriteX,this.spriteY, this.spritewh , this.spritewh);
		}
		
	}
	Sprite.prototype.update = function() {
		if(this.isHide)
			return;
		if(this.isMove && this.moveNo > 0){
			this.spriteX += this.dx;
			this.spriteY += this.dy;

			this.moveNo --;
		}
		if(this.isBomb){
			if(this.bombStep <= 0){
				this.isBomb = false;
				this.isHide = true;
			}
			game.FNO % 2 == 0 && this.bombStep --;
		}
		if(this.moveNo <= 0){
			this.ismoveNo = false;
		}

	};

	//运动
	Sprite.prototype.moveTo = function(targetRow,targetCol,duringFrames){
		this.isMove = true;
		this.moveNo = duringFrames;
		//计算每次移动的距离
		var targetX = calXYByRowCol(targetRow,targetCol).spriteX;
		var targetY = calXYByRowCol(targetRow,targetCol).spriteY;

		var distanceX = targetX - this.spriteX;
		var distanceY = targetY - this.spriteY;

		this.dx = distanceX / duringFrames;
		this.dy = distanceY / duringFrames;
	}
	//爆炸
	Sprite.prototype.bomb = function(callback){
		this.isBomb = true;
	}

	//根据行号、列号，计算x 和 y
	function calXYByRowCol(row,col){
		spritewh = (game.canvas.width - game.leftPadding * 2) / 7 - 4;
		//精灵的左侧位置
		spriteX = game.leftPadding + (game.spritewh + 4) * col;
		//距离顶部距离
		spriteY = game.canvas.height - game.bottom - (game.spritewh + 2) * (7 - row);

		return {
			spriteX : spriteX,
			spriteY : spriteY,
			spritewh : spritewh
		}
	}
})()