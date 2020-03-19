(function(){
	//地图决定精灵初始位置
	var Map = window.Map = function(){
		this.code = [
			[_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
			[_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
			[_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
			[_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
			[_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
			[_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
			[_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)]
		];
		/*this.code = [
				[1,2,3,3,3,3,4],
				[1,5,5,3,2,6,4],
				[2,4,2,3,3,2,6],
				[3,2,6,5,4,4,4],
				[4,2,3,2,5,3,2],
				[3,2,3,1,6,3,4],
				[2,1,3,6,6,3,4],
			];*/
		//存放真实精灵
		this.sprites = [[],[],[],[],[],[],[]];

		//一共有14种类型的精灵，每次开局时，需要从14个精灵中选择其中的七个
		this.imageSrc = ["i0","i1","i2","i3","i4","i5","i6","i7","i8","i9","i10","i11","i12","i13"];
		this.imageNameSrc = _.sample(this.imageSrc,7);
		//0-5行的精灵，各自需要掉落的行数
		this.needToDropdown = [[],[],[],[],[],[]];

		//创建精灵数组
		this.createSpritesByCode();
	}
	//消除
	Map.prototype.eliminate = function(){
		var self = this;
		//验证是否combo，如果这一次的消除和上一次消除在250帧内，就是combo
		console.log("--",game.FNO - game.lastEliminate)
		if(game.FNO - game.lastEliminate <= 250){
			console.log("combo",game.combo)
			game.combo ++;		
		} else {
			game.combo = 1;
		}
		if(game.combo >= 8){
			game.Musics["e8"].load();//如果播放的声音有重合，再次加载
			game.Musics["e8"].play();
		} else {
			//播放声音
			game.Musics["e" + game.combo].load();//如果播放的声音有重合，再次加载
			game.Musics["e" + game.combo].play();
		}
		
		game.score = 2 * game.combo;
		game.lastEliminate = game.FNO;
		_.each(this.check(),function(item){
			self.sprites[item.row][item.col].bomb();
			//更新地图矩阵
			self.code[item.row][item.col] = -1;
		});
		console.log("eliminate");
	}
	//下落方法
	Map.prototype.dropdown = function(){
		for(var row = 0 ; row <= 5 ; row ++){
			for(var col = 0 ; col <= 6 ; col ++){
				if(this.code[row][col] === -1){
					this.needToDropdown[row][col] = 0;
				} else {
					//统计这个精灵下面有多少个空位
					var count = 0;
					for(var i = row + 1 ; i <= 6 ; i ++){
						if(this.code[i][col] === -1){
							count ++;
						}
					}
					this.needToDropdown[row][col] = count;
				}
			}
		}
		console.log("dropdown");
		//让精灵下落
		for(var row = 5 ; row >= 0 ; row --){
			for(var col = 0 ; col <= 6 ; col ++){
				this.sprites[row][col].moveTo(row + this.needToDropdown[row][col] , col , 20);
				//更新数字矩阵
				this.code[row + this.needToDropdown[row][col]][col] = this.code[row][col];
				if(this.needToDropdown[row][col] != 0)
					this.code[row][col] = -1;
			}
		}
	}
	//统计需要每列需要补齐多少个
	Map.prototype.supply = function(){
		var supply = [0,0,0,0,0,0,0];
		for(var col = 0 ; col < 7 ; col ++){
			for(var row = 0 ; row < 7 ; row ++){
				if(this.code[row][col] === -1){
					supply[col] ++;
					//补足code矩阵
					this.code[row][col] = _.random(0,6);
				}
			}
		}
		//根据矩阵生成精灵
		this.createSpritesByCode();
		//生成精灵后，将新生成的精灵放到上空，然后下落到指定位置
		for(var i = 0 ; i < 7 ; i ++){
			for(var j = 0 ; j < supply[i] ; j ++){
				this.sprites[j][i].spriteY = 10;
				this.sprites[j][i].moveTo(j,i,25);
			}
		}
		console.log("supply");
	}
	//交换元素
	Map.prototype.exchange = function(startRow,startCol,endRow,endCol) {
		var self = this;
		//交换两个精灵的位置
		this.sprites[startRow][startCol].moveTo(endRow,endCol,10);
		this.sprites[endRow][endCol].moveTo(startRow,startCol,10);
		game.fsm = "动画状态";
		//交换矩阵
		game.registCallback(10,function(){
			var temp = self.code[startRow][startCol];
			self.code[startRow][startCol] = self.code[endRow][endCol];
			self.code[endRow][endCol] = temp;

			//修改两个精灵的物理位置
			temp = self.sprites[startRow][startCol];
			self.sprites[startRow][startCol] = self.sprites[endRow][endCol];
			self.sprites[endRow][endCol] = temp;

			//进入状态B，检查是否能够消除
			game.fsm = "B";
		})
		
	};
	//检测地图中，哪些是需要消除的精灵
	Map.prototype.check = function(){
		this.code.push([]);
		var resultRow = [];
		//横向
		for(var row = 0 ; row < 7 ; row ++){
			var i = 0;
			var j = 1;
			while(i < 7){
				if(this.code[row][i] != this.code[row][j]){
					if(j - i >= 3){
						for(var m = i ; m < j ; m++){
							resultRow.push({row: row,col: m});
						}
					}
					i = j;
				}
				j ++;
			}
		}
		var resultCol = [];
		//纵向
		for(var col = 0 ; col < 7 ; col ++){
			var i = 0;
			var j = 1;
			while(i < 7){
				if(this.code[i][col] != this.code[j][col]){
					if(j - i >= 3){
						for(var m = i ; m < j ; m++){
							//判断是否重复
							var isExist = false;
							_.each(resultRow,function(item){
								if(item.row == m && item.col == col){
									isExist = true;
									return;
								}
							});
							!isExist && resultCol.push({row: m,col: col});
						}
					}
					i = j;
				}
				j ++;
			}
		}

		var allResult = resultRow.concat(resultCol);
		return allResult;
	}
	Map.prototype.createSpritesByCode = function(){
		for(var i = 0 ; i < 7 ; i ++){			
			for(var j = 0 ; j < 7 ; j ++){
				this.sprites[i][j] = new Sprite(i,j,this.imageNameSrc[this.code[i][j]]);
			}

		}
	}
	Map.prototype.render = function(){
		for(var i = 0 ; i < 7 ; i ++){
			for(var j = 0 ; j < 7 ; j ++){

				this.sprites[i][j].update();
				this.sprites[i][j].render();
				
			}
		}
	}
})()