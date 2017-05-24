/*
*--------------------------------------------------------------------
* jQuery-Plugin "layerManager"
* Version: 1.0
* Copyright (c) 2014 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
/*
*--------------------------------------------------------------------
* layerManager
* レイヤー管理
*--------------------------------------------------------------------
* parameters
* options @ artboard         :アートボード
*         @ navigation       :レイヤーナビゲーション
*         @ activatecallback :レイヤー選択時コールバック
* -------------------------------------------------------------------
*/
/* コンストラクタ */
var layerManager = function(options){
	var options=$.extend({
		artboard:null,
		navigation:null,
		activatecallback:null
	},options);
	if (options.artboard==null) {alert('アートボードを指定して下さい。');return;}
	var my=this;
	this.artboard=options.artboard.css({
		'background-color':'transparent',
		'overflow':'hidden',
		'transition':'none'
	});
	this.activelayer=null;
	this.navigation=null;
	this.operation='move';
	this.text=null;
	this.layers=[];
	/* レイヤーナビゲーション生成 */
	if (options.navigation)
	{
		this.navigation=new listNavigation({
			container:options.navigation,
			direction:'top',
			selected:'selected',
			dragover:'dragover',
			selectedcallback:function(index){
				/* イベント発火 */
				var event=new $.Event('layeractivate',{layer:my.layers[index]});
				my.artboard.trigger(event);
			},
			draggedcallback:function(indexes){
				my.layers[indexes.from].layer.insertBefore(my.layers[indexes.to].layer);
				my.organize();
			}
		});
	}
	/* テキストエディター生成 */
	this.text=new textController({container:this.artboard});
	/* レイヤーイベント */
	this.artboard.on('layeractivate',function(e){
		if (my.activelayer) my.activelayer.operation=((my.operation!='move')?'lock':my.operation);
		my.activelayer=e.layer;
		if (my.activelayer)
		{
			my.activelayer.operation=my.operation;
			if (options.activatecallback) options.activatecallback(e.layer);
			/* レイヤーナビゲーション選択切替 */
			if (my.navigation) my.navigation.activate(my.layers.indexOf(my.activelayer));
		}
	});
	this.artboard.on('layerdelete',function(e){
		/* イベント発火 */
		var event=new $.Event('layeractivate',{layer:e.layer});
		my.artboard.trigger(event);
		my.delete();
	});
	this.artboard.on('layertextchange',function(e){
		if (my.navigation) my.navigation.text(my.layers.indexOf(e.layer),e.value);
	});
};
/* 関数定義 */
layerManager.prototype={
	/* ドローレイヤー生成 */
	adddraw:function(){
		var ctrlLayer=new layerController({
			artboard:this.artboard,
			type:'draw',
			height:this.artboard.height(),
			width:this.artboard.width(),
			brushBlur:((this.layers.length!=0)?this.layers[0].brushBlur:0),
			brushColor:((this.layers.length!=0)?this.layers[0].brushColor:'#000000'),
			brushTransparency:((this.layers.length!=0)?this.layers[0].brushTransparency:1),
			brushWidth:((this.layers.length!=0)?this.layers[0].brushWidth:1),
			wheelzoom:false
		});
		/* レイヤー配置 */
		this.append(ctrlLayer);
		/* レイヤーナビゲーション配置 */
		if (this.navigation) this.navigation.append('draw','ブラシアート');
	},
	/* 画像レイヤー生成 */
	addimage:function(src,filename){
		var my=this;
		var image=new Image();
		image.onload=function(){
			var ctrlLayer=new layerController({
				artboard:my.artboard,
				type:'image',
				height:image.height,
				width:image.width,
				src:image,
				wheelzoom:false
			});
			/* 描画終了 */
			my.drawend();
			/* レイヤー配置 */
			my.append(ctrlLayer);
			/* レイヤーナビゲーション配置 */
			if (my.navigation) my.navigation.append('image',filename);
		};
		image.src=src;
	},
	/* テキストレイヤー生成 */
	addtext:function(){
		var ctrlLayer=new layerController({
			artboard:this.artboard,
			type:'text',
			height:this.artboard.height(),
			width:this.artboard.width(),
			text:this.text,
			wheelzoom:false
		});
		/* 描画終了 */
		this.drawend();
		/* レイヤー配置 */
		this.append(ctrlLayer);
		/* レイヤーナビゲーション配置 */
		if (this.navigation) this.navigation.append('text','テキスト');
	},
	/* レイヤー配置 */
	append:function(layer){
		this.layers.push(layer);
		this.organize();
		/* イベント発火 */
		var event=new $.Event('layeractivate',{layer:layer});
		this.artboard.trigger(event);
	},
	/* 背景色設定 */
	background:function(color){
		if (color.length==0) this.artboard.css({'background-color':'transparent'});
		else this.artboard.css({'background-color':color});
	},
	/* ブラシぼかし設定 */
	brushBlur:function(value){
		var my=this;
		if (value) $.each(this.layers,function(index){my.layers[index].brushBlur=value});
		if (this.layers.length!=0) return this.layers[0].brushBlur;
		else return 0;
	},
	/* ブラシ色設定 */
	brushColor:function(value){
		var my=this;
		if (value) $.each(this.layers,function(index){my.layers[index].brushColor=value});
		if (this.layers.length!=0) return this.layers[0].brushColor;
		else return "#000000";
	},
	/* ブラシ透明度設定 */
	brushTransparency:function(value){
		var my=this;
		if (value) $.each(this.layers,function(index){my.layers[index].brushTransparency=value});
		if (this.layers.length!=0) return this.layers[0].brushTransparency;
		else return 1;
	},
	/* ブラシ太さ設定 */
	brushWidth:function(value){
		var my=this;
		if (value) $.each(this.layers,function(index){my.layers[index].brushWidth=value});
		if (this.layers.length!=0) return this.layers[0].brushWidth;
		else return 1;
	},
	/* 削除 */
	delete:function(){
		if (!this.activelayer) return;
		var bottomlayer=this.activelayer.bottomlayer;
		var deletelayer=this.activelayer;
		var controller=null;
		/* レイヤーナビゲーション削除 */
		if (this.navigation) this.navigation.delete(this.layers.indexOf(deletelayer));
		/* レイヤー削除 */
		this.layers=$.grep(this.layers,function(item,index){return item.layer[0]!=deletelayer.layer[0]});
		this.artboard[0].removeChild(this.activelayer.layer[0]);
		this.activelayer=null;
		this.organize();
		/* アクティブレイヤー再設定 */
		if (bottomlayer==null && this.layers.length!=0) bottomlayer=this.artboard.find('canvas').first();
		if (bottomlayer) controller=$.grep(this.layers,function(item,index){return item.layer[0]==bottomlayer[0]})[0];
		/* イベント発火 */
		var event=new $.Event('layeractivate',{layer:controller});
		this.artboard.trigger(event);
	},
	/* 描画準備 */
	drawready:function(operation){
		var my=this;
		/* 変数初期化 */
		this.operation=(operation)?operation:'brush';
		/* レイヤーロック */
		$.each(this.layers,function(index){my.layers[index].operation='lock'});
		/* 描画判定設定 */
		if ($.grep(this.layers,function(item,index){return item.type=='draw'}).length==0) this.adddraw();
		else this.activelayer.operation=operation;
	},
	/* 描画終了 */
	drawend:function(){
		var my=this;
		/* 変数初期化 */
		this.operation='move';
		/* レイヤーロック解除 */
		$.each(this.layers,function(index){my.layers[index].operation='move';});
	},
	/* 配置位置調整 */
	organize:function(){
		var my=this;
		var bottomlayer=null;
		$.each(this.artboard.find('canvas'),function(index){
			var layer=$(this);
			var controller=$.grep(my.layers,function(item,index){return item.layer[0]==layer[0]})[0];
			controller.bottomlayer=bottomlayer;
			bottomlayer=controller.layer;
		});
	},
	/* リサイズ */
	resize:function(options){
		var options=$.extend({
			height:150,
			width:300,
		},options);
		var my=this;
		this.artboard.css({'height':options.height+'px','width':options.width+'px'});
		/* レイヤーリサイズ */
		$.each(this.layers,function(index){my.layers[index].resize();});
	},
	/* 保存 */
	save:function(callback){
		var my=this;
		var canvas=$('<canvas height="'+this.artboard.height()+'" width="'+this.artboard.width()+'">');
		var context=canvas[0].getContext('2d');
		var sortlayers=new Array(this.layers.length);
		$.each(this.artboard.find('canvas'),function(index){
			var layer=$(this);
			sortlayers[index]=$.grep(my.layers,function(item,index){return item.layer[0]==layer[0]})[0];
		});
		/* 背景描画 */
		if (this.artboard.css('background-color')!='transparent')
		{
			context.fillStyle=this.artboard.css('background-color');
			context.fillRect(0,0,this.artboard.width(),this.artboard.height());
		}
		/* レイヤー描画 */
		$.each(sortlayers,function(index){
			var layer=sortlayers[index];
			if (layer.layer.isVisible())
				context.drawImage(
					layer.layer[0],
					0,
					0,
					layer.basewidth,
					layer.baseheight,
					layer.layer.offset().left-my.artboard.offset().left,
					layer.layer.offset().top-my.artboard.offset().top,
					layer.basewidth*(layer.zoom/100),
					layer.baseheight*(layer.zoom/100)
				);
		});
		res=canvas[0].toDataURL('image/png');
		canvas.remove();
		if (callback) callback();
		return res;
	}
};
/*
*--------------------------------------------------------------------
* layerController
* レイヤー操作コントローラー
*--------------------------------------------------------------------
* parameters
* options @ artboard          :アートボード
*         @ type              :レイヤータイプ【draw:image:text】
*         @ height            :高さ
*         @ width             :幅
*         @ brushBlur         :ブラシぼかし
*         @ brushColor        :ブラシ色
*         @ brushTransparency :ブラシ透明度
*         @ brushWidth        :ブラシ太さ
*         @ src               :画像配置用イメージオブジェクト
*         @ zoommin           :拡大率最小値
*         @ zoommax           :拡大率最大値
*         @ wheelzoom         :マウスホイールズーム許可判定
*         @ wheelcallback     :マウスホイールズームコールバック
* -------------------------------------------------------------------
*/
/* コンストラクタ */
var layerController = function(options){
	var options=$.extend({
		artboard:null,
		type:'draw',
		height:150,
		width:300,
		brushBlur:0,
		brushColor:'#000000',
		brushTransparency:1,
		brushWidth:1,
		src:null,
		text:null,
		zoommin:0,
		zoommax:1000,
		wheelzoom:true,
		wheelcallback:null
	},options);
	if (options.artboard==null) {alert('アートボードを指定して下さい。');return;}
	var my=this;
	/* 変数定義 */
	this.artboard=options.artboard;
	this.type=options.type;
	this.baseheight=options.height;
	this.basewidth=options.width;
	this.height=options.height;
	this.width=options.width;
	this.brushBlur=options.brushBlur;
	this.brushColor=options.brushColor;
	this.brushTransparency=options.brushTransparency;
	this.brushWidth=options.brushWidth;
	this.bottomlayer=null;
	this.capture=false;
	this.centerX=null;
	this.centerY=null;
	this.context=null;
	this.operation='move';
	this.zoom=100;
	this.histories=[];
	this.down={
		left:0,
		top:0
	};
	this.keep={
		left:0,
		top:0
	};
	this.text={
		check:0,
		controller:options.text,
		draw:{left:0,top:0,height:0,width:0},
		rect:{left:0,top:0,height:0,width:0},
		style:null,
		value:''
	};
	/* コンテナ取得 */
	this.container=(this.artboard.prop('tagName').toLowerCase()!='body')?this.artboard.parent():this.artboard;
	/* レイヤー生成 */
	this.layer=$('<canvas height="'+this.height+'" width="'+this.width+'">').css({
		'display':'block',
		'position':'absolute',
		'transition':'none'
	});
	if (this.layer[0].getContext)
	{
		this.context=this.layer[0].getContext('2d');
		/* 画像描画 */
		if (this.type=='image') this.context.drawImage(options.src,0,0);
		/* レイヤー配置 */
		this.relocation();
		this.artboard.append(this.layer);
		/* テキストエディター設定 */
		if (this.type=='text')
			if (this.text.controller)
			{
				/* テキストエディター表示 */
				this.text.rect.left=((this.container[0].clientWidth-this.text.controller.layer.outerWidth(true))/2)+this.container.scrollLeft();
				this.text.rect.top=((this.container[0].clientHeight-this.text.controller.layer.outerHeight(true))/2)+this.container.scrollTop();
				this.text.controller.editstart(this.layer,this.text.rect,this.text.style,this.text.value);
				/* テキスト編集キャンセル */
				this.layer.on('editcancel',function(e){
					/* 再描画 */
					if (my.text.value.length!=0) my.redraw();
					else
					{
						/* イベント発火 */
						var event=new $.Event('layerdelete',{layer:my});
						my.artboard.trigger(event);
					}
				});
				/* テキスト編集終了 */
				this.layer.on('editend',function(e){
					/* テキストエディター座標変換 */
					var position=my.layerposition();
					e.rect.left-=position.left;
					e.rect.top-=position.top;
					/* 引数取得 */
					my.text.draw=e.draw;
					my.text.rect=e.rect;
					my.text.style=e.style;
					my.text.value=e.value;
					/* 再描画 */
					if (e.value.length!=0)
					{
						my.redraw();
						/* イベント発火 */
						var event=new $.Event('layertextchange',{layer:my,value:e.value.replace('\r\n','\n').split('\n')[0]});
						my.artboard.trigger(event);
					}
					else
					{
						/* イベント発火 */
						var event=new $.Event('layerdelete',{layer:my});
						my.artboard.trigger(event);
					}
				});
			}
		/*
		*------------------------------------------------------------
		* マウス操作
		*------------------------------------------------------------
		*/
		this.layer.on('mousedown',function(e){
			var left=e.clientX-my.layer.offset().left;
			var top=e.clientY-my.layer.offset().top;
			switch(my.operation)
			{
				case 'brush':
				case 'erase':
					if (my.type=='draw')
					{
						/* 描画開始 */
						my.capture=true;
						/* 再描画用変数保持 */
						my.histories.push({
							path:[],
							globalCompositeOperation:((my.operation=='erase')?'destination-out':'source-over'),
							lineCap:'round',
							lineJoin:'round',
							lineWidth:my.brushWidth,
							shadowBlur:my.brushBlur,
							shadowColor:$.toRGBA(my.brushColor,my.brushTransparency),
							strokeStyle:$.toRGBA(my.brushColor,my.brushTransparency)
						});
						my.histories[my.histories.length-1].path.push({type:'m',x:left,y:top});
						/* 再描画 */
						my.redraw();
						/* イベント発火 */
						var event=new $.Event('layeractivate',{layer:my});
						my.artboard.trigger(event);
					}
					break;
				case 'move':
					var position=my.layerposition();
					if (my.type=='text')
					{
						setTimeout(function(){
							if (my.text.click>1)
							{
								/* ドラッグ解除 */
								my.capture=false;
								/* テキスト編集開始 */
								if (my.hit(left,top))
								{
									/* テキストエディター座標変換 */
									var rect=my.text.rect;
									rect.left+=position.left;
									rect.top+=position.top;
									/* レイヤー初期化 */
									my.context.clearRect(0,0,my.basewidth,my.baseheight);
									/* テキストエディター表示 */
									my.text.controller.editstart(my.layer,rect,my.text.style,my.text.value);
								}
							}
							my.text.click=0;
						},250);
						my.text.click++;
					}
					my.down.left=position.left;
					my.down.top=position.top;
					my.keep.left=e.clientX;
					my.keep.top=e.clientY;
					if (my.hit(left,top))
					{
						/* ドラッグ開始 */
						my.capture=true;
						/* イベント発火 */
						var event=new $.Event('layeractivate',{layer:my});
						my.artboard.trigger(event);
					}
					break;
			}
			/* 下層要素へ引き継ぎ */
			if ( my.bottomlayer && !my.capture)
			{
				var event=new $.Event('mousedown',e);
				my.bottomlayer.trigger(event);
			}
			e.preventDefault();
		});
		$(window).on('mousemove',function(e){
			switch(my.operation)
			{
				case 'brush':
				case 'erase':
					if (my.type=='draw') my.artboard.css({'cursor':'crosshair'});
					else my.artboard.css({'cursor':'not-allowed'});
					break;
				case 'move':
					my.artboard.css({'cursor':'move'});
					break;
			}
			if (!my.capture) return;
			var left=0;
			var top=0;
			switch(my.operation)
			{
				case 'brush':
				case 'erase':
					if (my.type=='draw')
					{
						/* 描画 */
						left=e.clientX-my.layer.offset().left;
						top=e.clientY-my.layer.offset().top;
						if (left<0) return;
						if (left>my.layer.width()) return;
						if (top<0) return;
						if (top>my.layer.height()) return;
						/* 再描画用変数保持 */
						my.histories[my.histories.length-1].path.push({type:'l',x:left,y:top});
						/* 再描画 */
						my.redraw();
					}
					break;
				case 'move':
					/* ドラッグ */
					left=my.down.left+e.clientX-my.keep.left;
					top=my.down.top+e.clientY-my.keep.top;
					my.layer.css({
						'left':left.toString()+'px',
						'top':top.toString()+'px'
					});
					break;
			}
		    e.preventDefault();
		});
		$(window).on('mouseup',function(e){
			if (!my.capture) return;
			var left=0;
			var top=0;
			switch(my.operation)
			{
				case 'brush':
				case 'erase':
					/* 描画終了 */
					my.capture=false;
					/* 再描画 */
					my.redraw();
					break;
				case 'move':
					/* ドラッグ終了 */
					left=my.down.left+e.clientX-my.keep.left;
					top=my.down.top+e.clientY-my.keep.top;
					my.capture=false;
					/* リサイズ */
					my.resize();
					break;
			}
		    e.preventDefault();
		});
		/*
		*------------------------------------------------------------
		* マウスホイール操作
		*------------------------------------------------------------
		*/
		$(window).on(('onwheel' in document)?'wheel':('onmousewheel' in document)?'mousewheel':'DOMMouseScroll',function(e,delta,deltaX,deltaY){
			if (!options.wheelzoom) return;
			var delta=(e.originalEvent.deltaY)?e.originalEvent.deltaY*-1:(e.originalEvent.wheelDelta)?e.originalEvent.wheelDelta:e.originalEvent.detail*-1;
			my.zoom+=(delta<0)?-50:50;
			if (my.zoom<options.zoommin) my.zoom=options.zoommin;
			if (my.zoom>options.zoommax) my.zoom=options.zoommax;
			my.relocation(my.zoom);
			if (options.wheelcallback) options.wheelcallback(my.zoom);
			e.preventDefault();
		});
	}
	else alert('本サービスはご利用中のブラウザには対応しておりません。');
};
/* 関数定義 */
layerController.prototype={
	/* 領域内判定 */
	hit:function(x,y)
	{
		if (this.type=='text')
		{
			if (x<this.text.rect.left+this.text.draw.left) return false;
			if (x>this.text.rect.left+this.text.draw.left+this.text.draw.width) return false;
			if (y<this.text.rect.top+this.text.draw.top) return false;
			if (y>this.text.rect.top+this.text.draw.top+this.text.draw.height) return false;
			return true;
		}
		else
		{
			if (x<0) return false;
			if (x>this.width) return false;
			if (y<0) return false;
			if (y>this.height) return false;
			if (this.context.getImageData(x,y,1,1).data[3]!=0) return true;
			else return false;
		}
	},
	/* レイヤー再描画 */
	redraw:function(adjust){
		var my=this;
		/* レイヤー初期化 */
		this.context.clearRect(0,0,this.basewidth,this.baseheight);
		switch(my.type)
		{
			case 'draw':
				$.each(this.histories,function(index){
					var history=my.histories[index];
					var path=new Path2D();
					/* 描画設定 */
					my.context.globalCompositeOperation=history.globalCompositeOperation;
					my.context.lineCap=history.lineCap;
					my.context.lineJoin=history.lineJoin;
					my.context.lineWidth=history.lineWidth;
					my.context.shadowBlur=history.shadowBlur;
					my.context.shadowColor=history.shadowColor;
					my.context.strokeStyle=history.strokeStyle;
					/* 描画 */
					for (var i=0;i<history.path.length;i++)
					{
						if (adjust)
						{
							history.path[i].x+=adjust.x;
							history.path[i].y+=adjust.y;
						}
						switch(history.path[i].type)
						{
							case 'm':
								path.moveTo(history.path[i].x,history.path[i].y);
								break;
							case 'l':
								path.lineTo(history.path[i].x,history.path[i].y);
								break;
						}
					}
					path.moveTo(history.path[history.path.length-1].x,history.path[history.path.length-1].y);
					path.closePath();
					my.context.stroke(path);
				});
				break;
			case 'text':
				var left=0;
				var top=0;
				if (adjust)
				{
					this.text.rect.left+=adjust.x;
					this.text.rect.top+=adjust.y;
				}
				left=this.text.rect.left;
				top=this.text.rect.top;
				/* 描画設定 */
				switch(this.text.style.align)
				{
					case 'center':
						left+=this.text.draw.left+this.text.draw.width/2;
						break;
					case 'right':
						left+=this.text.draw.left+this.text.draw.width;
						break;
					default:
						left+=this.text.draw.left;
						break;
				}
				top+=this.text.draw.top;
				my.context.fillStyle=$.toRGBA(this.text.style.color,this.text.style.transparent);
				my.context.font=this.text.style.style+' '+this.text.style.weight+' '+this.text.style.size+' '+this.text.style.family;
				my.context.shadowBlur=this.text.style.blur;
				my.context.shadowColor=$.toRGBA(this.text.style.color,this.text.style.transparent);
				my.context.textAlign=this.text.style.align;
				my.context.textBaseline='hanging';
				/* 描画 */
				var values=this.text.value.replace('\r\n','\n').split('\n');
				for (var i=0;i<values.length;i++)
				{
					my.context.fillText(values[i],left,top);
					top+=parseInt(this.text.style.lineheight);
				}
				break;
		}
	},
	/* レイヤー再配置 */
	relocation:function(zoom){
		var left=0;
		var top=0;
		if (zoom!=null)
		{
			this.zoom=zoom;
			this.height=this.baseheight*(this.zoom/100);
			this.width=this.basewidth*(this.zoom/100);
		}
		if (this.centerX==null)
		{
			left=((this.container[0].clientWidth-this.width)/2)+this.container.scrollLeft();
			top=((this.container[0].clientHeight-this.height)/2)+this.container.scrollTop();
		}
		else
		{
			left=(this.centerX*this.artboard.outerWidth(false))-(this.width/2);
			top=(this.centerY*this.artboard.outerHeight(false))-(this.height/2);
		}
		this.layer.css({'left':left.toString()+'px','top':top.toString()+'px','width':this.width.toString()+'px'})
		this.centerX=(left+(this.width/2))/this.artboard.outerWidth(false);
		this.centerY=(top+(this.height/2))/this.artboard.outerHeight(false);
	},
	/* レイヤーリサイズ */
	resize:function(){
		var left=this.layer.offset().left-this.artboard.offset().left-parseInt(this.artboard.css('border-left-width'));
		var top=this.layer.offset().top-this.artboard.offset().top-parseInt(this.artboard.css('border-top-width'));
		if (this.type!='image')
		{
			var height=this.baseheight;
			var width=this.basewidth;
			var redraw=false;
			var adjust={x:0,y:0};
			/* 位置・サイズ調整 */
			if (left>0) {adjust.x=left;width+=left;left=0;redraw=true;}
			if (top>0) {adjust.y=top;height+=top;top=0;redraw=true;}
			if (left+width<this.artboard.outerWidth(false)) {width+=this.artboard.outerWidth(false)-(left+width);redraw=true;}
			if (top+height<this.artboard.outerHeight(false)) {height+=this.artboard.outerHeight(false)-(top+height);redraw=true;}
			if (redraw)
			{
				this.baseheight=height;
				this.basewidth=width;
				this.height=height;
				this.width=width;
				this.layer.attr('height',height);
				this.layer.attr('width',width);
				this.layer.css({
					'left':left.toString()+'px',
					'top':top.toString()+'px'
				});
			}
			/* 再描画 */
			if (redraw) this.redraw(adjust);
		}
		this.centerX=(left+(this.width/2))/this.artboard.outerWidth(false);
		this.centerY=(top+(this.height/2))/this.artboard.outerHeight(false);
		this.relocation();
	},
	/* レイヤー座標 */
	layerposition:function(){
		return {
			left:this.layer.offset().left-this.artboard.offset().left-parseInt(this.artboard.css('border-left-width')),
			top:this.layer.offset().top-this.artboard.offset().top-parseInt(this.artboard.css('border-top-width'))
		};
	}
};
/*
*--------------------------------------------------------------------
* textController
* テキスト操作コントローラー
*--------------------------------------------------------------------
* parameters
* options @ container :コンテナ
*         @ text      :初期表示テキスト
* -------------------------------------------------------------------
*/
/* コンストラクタ */
var textController = function(options){
	var options=$.extend({
		container:null,
	},options);
	if (options.container==null) {alert('テキスト配置ボックスを指定して下さい。');return;}
	var my=this;
	/* 変数定義 */
	this.container=options.container;
	this.sender=null;
	this.down={
		left:0,
		top:0
	};
	this.keep={
		left:0,
		top:0
	};
	/* レイヤー生成 */
	this.layer=$('<div>').css({
		'background-color':'rgba(255,255,255,0.75)',
		'box-shadow':'0px 0px 2px rgba(0,0,0,0.5)',
		'border-radius':'0.25em',
		'cursor':'move',
		'display':'block',
		'margin':'0px',
		'padding':'30px 5px 5px 5px',
		'position':'absolute',
		'transition':'none'
	});
	/* フォント名選択コントロール生成 */
	this.fontfamily=new fontController({type:'fontfamily'});
	this.fontfamily.controller.on('valuechanged',function(e){
		my.textarea.css({'font-family':e.value});
		/* イベント発火 */
		var event=new $.Event('keyup');
		my.textarea.trigger(event);
	});
	/* フォントサイズ入力コントロール生成 */
	this.fontsize=new fontController({type:'fontsize'});
	this.fontsize.controller.on('valuechanged',function(e){
		my.textarea.css({'font-size':e.value});
		/* イベント発火 */
		var event=new $.Event('keyup');
		my.textarea.trigger(event);
	});
	/* フォントスタイル選択コントロール生成 */
	this.fontstyle=new fontController({type:'fontstyle'});
	this.fontstyle.controller.on('valuechanged',function(e){
		my.textarea.css({'font-style':e.value});
		/* イベント発火 */
		var event=new $.Event('keyup');
		my.textarea.trigger(event);
	});
	/* フォント太さ選択コントロール生成 */
	this.fontweight=new fontController({type:'fontweight'});
	this.fontweight.controller.on('valuechanged',function(e){
		my.textarea.css({'font-weight':e.value});
		/* イベント発火 */
		var event=new $.Event('keyup');
		my.textarea.trigger(event);
	});
	/* 行高さ入力コントロール生成 */
	this.lineheight=new fontController({type:'lineheight'});
	this.lineheight.controller.on('valuechanged',function(e){
		my.textarea.css({'line-height':e.value});
		/* イベント発火 */
		var event=new $.Event('keyup');
		my.textarea.trigger(event);
	});
	/* 行揃え選択コントロール生成 */
	this.textalign=new fontController({type:'textalign'});;
	this.textalign.controller.on('valuechanged',function(e){
		my.textarea.css({'text-align':e.value});
		/* イベント発火 */
		var event=new $.Event('keyup');
		my.textarea.trigger(event);
	});
	/* フォント前景色選択コントロール生成 */
	this.fontcolor=new fontController({type:'fontcolor'});
	this.fontcolor.controller.on('valuechanged',function(e){
		my.style.color=e.value;
		my.textarea.css({'color':$.toRGBA(my.style.color,my.style.transparent)});
		/* イベント発火 */
		var event=new $.Event('keyup');
		my.textarea.trigger(event);
	});
	/* フォント透明度入力コントロール生成 */
	this.fonttransparent=new fontController({type:'fonttransparent'});
	this.fonttransparent.controller.on('valuechanged',function(e){
		my.style.transparent=parseFloat(e.value);
		my.textarea.css({'color':$.toRGBA(my.style.color,my.style.transparent)});
		/* イベント発火 */
		var event=new $.Event('keyup');
		my.textarea.trigger(event);
	});
	/* フォントぼかし入力コントロール生成 */
	this.fontblur=new fontController({type:'fontblur'});
	this.fontblur.controller.on('valuechanged',function(e){
		my.style.blur=parseInt(e.value);
		my.textarea.css({'text-shadow':'0px 0px '+e.value+' '+$.toRGBA(my.style.color,my.style.transparent)});
		/* イベント発火 */
		var event=new $.Event('keyup');
		my.textarea.trigger(event);
	});
	/* テキストエリア生成 */
	this.textarea=$('<textarea placeholder="テキストを入力して下さい"></textarea>').css({
		'background-color':'transparent',
		'border':'1px solid #87ceeb',
		'display':'block',
		'letter-spacing':'normal',
		'margin':'0px 0px 5px 0px',
		'min-width':'100%',
		'overflow':'hidden',
		'padding':'0px',
		'resize':'none',
		'text-indent':'0px',
		'transition':'none',
		'white-space':'nowrap',
		'width':'auto',
		'word-spacing':'normal'
	})
	.on('keyup',function(e){my.textarea.css({'height':my.textarea[0].scrollHeight.toString()+'px','width':my.textarea[0].scrollWidth.toString()+'px'});})
	.on('mousedown',function(e){e.stopPropagation();});
	/* レイヤー配置 */
	this.container.append(
		this.layer
		.append($('<div>').css({
				'background-color':'transparent',
				'display':'block',
				'margin':'0px',
				'padding':'0px',
				'white-space':'nowrap'
			})
			.append(this.fontfamily.controller)
			.append(this.fontsize.controller)
			.append(this.lineheight.controller)
		)
		.append($('<div>').css({
				'background-color':'transparent',
				'display':'block',
				'margin':'0px',
				'padding':'0px',
				'white-space':'nowrap'
			})
			.append(this.fontstyle.controller)
			.append(this.fontweight.controller)
			.append(this.textalign.controller)
			.append(this.fontcolor.controller)
			.append(this.fonttransparent.controller)
			.append(this.fontblur.controller)
		)
		.append(this.textarea)
		.append($('<button>Cancel</button>')
			.css({'display':'inline-block','margin':'0px'})
			.on('click',function(){my.editcancel();})
		)
		.append($('<button>OK</button>')
			.css({'display':'inline-block','margin':'0px 0px 0px 5px'})
			.on('click',function(){my.editend();})
		)
		.hide()
	);
	/* 描画設定初期化 */
	this.style={
		align:'left',
		blur:0,
		color:'#2B2B2B',
		family:'sans-serif',
		lineheight:this.textarea.css('line-height'),
		style:'normal',
		size:this.textarea.css('font-size'),
		transparent:1,
		weight:'normal'
	};
	/*
	*----------------------------------------------------------------
	* マウス操作
	*----------------------------------------------------------------
	*/
	this.layer.on('mousedown',function(e){
		my.down.left=my.layer.offset().left-my.container.offset().left-parseInt(my.container.css('border-left-width'));
		my.down.top=my.layer.offset().top-my.container.offset().top-parseInt(my.container.css('border-top-width'));
		my.keep.left=e.clientX;
		my.keep.top=e.clientY;
		/* ドラッグ開始 */
		my.capture=true;
		e.preventDefault();
	});
	$(window).on('mousemove',function(e){
		if (!my.capture) return;
		/* ドラッグ */
		my.layer.css({
			'left':(my.down.left+e.clientX-my.keep.left).toString()+'px',
			'top':(my.down.top+e.clientY-my.keep.top).toString()+'px'
		});
	    e.preventDefault();
	});
	$(window).on('mouseup',function(e){
		if (!my.capture) return;
		/* ドラッグ終了 */
		my.capture=false;
	    e.preventDefault();
	});
};
/* 関数定義 */
textController.prototype={
	/* 編集開始 */
	editstart:function(sender,rect,style,value)
	{
		/* 変数保持 */
		this.sender=sender;
		this.style=$.extend({
			align:this.style.align,
			blur:this.style.blur,
			color:this.style.color,
			family:this.style.family,
			lineheight:this.style.lineheight,
			style:this.style.style,
			size:this.style.size,
			transparent:this.style.transparent,
			weight:this.style.weight
		},style);
		/* 各種フォント設定値コントローラー初期化 */
		this.fontblur.val(this.style.blur);
		this.fontcolor.val(this.style.color);
		this.fontfamily.val(this.style.family);
		this.fontsize.val(this.style.size);
		this.fontstyle.val(this.style.style);
		this.fonttransparent.val(this.style.transparent);
		this.fontweight.val(this.style.weight);
		this.lineheight.val(this.style.lineheight);
		this.textalign.val(this.style.align);
		/* テキスト設定 */
		this.textarea.css({
			'color':$.toRGBA(this.style.color,this.style.transparent),
			'font-family':this.style.family,
			'font-size':this.style.size,
			'font-style':this.style.style,
			'font-weight':this.style.weight,
			'height':this.style.size,
			'line-height':this.style.lineheight,
			'padding':'0px',
			'text-align':this.style.align,
			'text-shadow':'0px 0px '+this.style.blur+'px '+$.toRGBA(this.style.color,this.style.transparent)
		}).val(value);
		/* レイヤー表示 */
		if (this.container.children().length!=0) this.layer.insertAfter(this.container.children().last());
		this.layer.css({
			'left':rect.left,
			'top':rect.top
		}).show();
		/* イベント発火 */
		var event=new $.Event('keyup');
		this.textarea.trigger(event);
	},
	/* 編集キャンセル */
	editcancel:function()
	{
		/* イベント発火 */
		var event=new $.Event('editcancel');
		this.sender.trigger(event);
		/* レイヤー消去 */
		this.layer.hide();
	},
	/* 編集終了 */
	editend:function()
	{
		var borderholizontal=parseInt(this.textarea.css('border-left-width'))+parseInt(this.textarea.css('border-right-width'));
		var bordervertical=parseInt(this.textarea.css('border-top-width'))+parseInt(this.textarea.css('border-bottom-width'));
		var padding=(parseInt(this.textarea.css('line-height'))-parseInt(this.textarea.css('font-size')))/2;
		/* イベント発火 */
		var event=new $.Event('editend',{
			draw:{
				left:this.textarea.position().left+parseInt(this.textarea.css('border-left-width')),
				top:this.textarea.position().top+parseInt(this.textarea.css('border-top-width'))+padding,
				height:this.textarea.outerHeight(false)-bordervertical-padding,
				width:this.textarea.outerWidth(false)-borderholizontal
			},
			rect:{
				left:this.layer.offset().left-this.container.offset().left-parseInt(this.container.css('border-left-width')),
				top:this.layer.offset().top-this.container.offset().top-parseInt(this.container.css('border-top-width')),
				height:this.layer.outerHeight(false),
				width:this.layer.outerWidth(false)
			},
			style:{
				align:this.textarea.css('text-align'),
				blur:this.style.blur,
				color:this.style.color,
				family:this.textarea.css('font-family'),
				lineheight:this.textarea.css('line-height'),
				style:this.textarea.css('font-style'),
				size:this.textarea.css('font-size'),
				transparent:this.style.transparent,
				weight:this.textarea.css('font-weight')
			},
			value:this.textarea.val()
		});
		this.sender.trigger(event);
		/* レイヤー消去 */
		this.layer.hide();
		/* テキスト初期化 */
		this.textarea.val('');
		/* イベント発火 */
		var event=new $.Event('keyup');
		this.textarea.trigger(event);
	}
};
/*
*--------------------------------------------------------------------
* fontController
* フォント設定値コントローラー
*--------------------------------------------------------------------
* parameters
* options @ container :コンテナ
*         @ text      :初期表示テキスト
* -------------------------------------------------------------------
*/
/* コンストラクタ */
var fontController = function(options){
	var options=$.extend({
		type:null,
	},options);
	if (options.type==null) {alert('要素の型を指定して下さい。');return;}
	var my=this;
	var fonts=[
		'MS UI Gothic',
		'ＭＳ Ｐゴシック',
		'ＭＳ ゴシック',
		'ＭＳ Ｐ明朝',
		'ＭＳ 明朝',
		'メイリオ',
		'Meiryo UI',
		'游ゴシック',
		'游明朝',
		'ヒラギノ角ゴ Pro W3',
		'ヒラギノ角ゴ ProN W3',
		'ヒラギノ角ゴ Pro W6',
		'ヒラギノ角ゴ ProN W6',
		'ヒラギノ角ゴ Std W8',
		'ヒラギノ角ゴ StdN W8',
		'ヒラギノ丸ゴ Pro W4',
		'ヒラギノ丸ゴ ProN W4',
		'ヒラギノ明朝 Pro W3',
		'ヒラギノ明朝 ProN W3',
		'ヒラギノ明朝 Pro W6',
		'ヒラギノ明朝 ProN W6',
		'游ゴシック体',
		'游明朝体',
		'游明朝体+36ポかな',
		'HG行書体',
		'HGP行書体',
		'HG正楷書体-PRO',
		'クレー',
		'筑紫A丸ゴシック',
		'筑紫B丸ゴシック',
		'Osaka',
		'Osaka－等幅',
		'Droid Sans',
		'Roboto',
		'cursive',
		'Comic Sans MS',
		'Jenkins v2.0',
		'Mv Boli',
		'Script',
		'sans-serif',
		'arial',
		'arial black',
		'arial narrow',
		'arial unicode ms',
		'Century Gothic',
		'Franklin Gothic Medium',
		'Gulim',
		'GulimChe',
		'Dotum',
		'Haettenschweiler',
		'Impact',
		'Lucida Sans Unicode',
		'Microsoft Sans Serif',
		'MS Sans Serif',
		'MV Boil',
		'New Gulim',
		'Tahoma',
		'Trebuchet',
		'Trebuchet MS',
		'Verdana',
		'serif',
		'Batang',
		'Book Antiqua',
		'Bookman Old Style',
		'Century',
		'Estrangelo Edessa',
		'Garamond',
		'Gautami',
		'Georgia',
		'Gungsuh',
		'Latha',
		'Mangal',
		'MS Serif',
		'NSimSun',
		'PMingLiU',
		'Palatino Linotype',
		'Raavi',
		'Roman',
		'Shruti',
		'Sylfaen',
		'Times New Roman',
		'Tunga',
		'monospace',
		'BatangChe',
		'Courier',
		'Courier New',
		'DotumChe',
		'GlimChe',
		'GungsuhChe',
		'Lucida Console',
		'MingLiU',
		'OCRB',
		'SimHei',
		'SimSun',
		'Small Fonts',
		'Terminal',
		'fantasy',
		'alba',
		'alba matter',
		'alba super',
		'baby kruffy',
		'Chick',
		'Croobie',
		'Fat',
		'Freshbot',
		'Frosty',
		'GlooGun',
		'Jokewood',
		'Modern',
		'Monotype Corsiva',
		'Poornut',
		'Pussycat Snickers',
		'Weltron Urban'
	];
	/* 変数定義 */
	this.type=options.type;
	this.controller=null;
	switch (options.type)
	{
		case 'fontblur':
		case 'fontsize':
		case 'fonttransparent':
		case 'lineheight':
			this.controller=$('<label>').css({
				'border':'none',
				'white-space':'nowrap'
			})
			.append($('<span></span>').css({
					'display':'inline-block',
					'font-size':'0.75em',
					'padding':'0px',
					'line-height':'1.8em',
					'width':'4em'
				})
			)
			.append($('<input type="number">').css({
					'background-color':'transparent',
					'border':'1px solid #87ceeb',
					'border-radius':'3px',
					'height':'1.8em',
					'text-align':'right',
					'width':'3em'
				})
				.on('mousedown',function(e){e.stopPropagation();})
				.on('change',function(e){
					/* イベント発火 */
					var event=null;
					if (options.type=='fonttransparent') event=new $.Event('valuechanged',{value:(parseInt($(this).val())/100).toString()});
					else event=new $.Event('valuechanged',{value:$(this).val()+'px'});
					my.controller.trigger(event);
				})
			)
			.append($('<span></span>').css({
					'display':'inline-block',
					'font-size':'0.75em',
					'padding':'0px',
					'line-height':'1.8em',
					'width':'2em'
				})
			)
			switch (options.type)
			{
				case 'fontblur':
					this.controller.find('span').first().text('ぼかし');
					this.controller.find('span').last().text('px');
					this.controller.find('input').attr('max',50);
					this.controller.find('input').attr('min',0);
					break;
				case 'fontsize':
					this.controller.find('span').first().text('フォント');
					this.controller.find('span').last().text('px');
					break;
				case 'fonttransparent':
					this.controller.find('span').first().text('透明度');
					this.controller.find('span').last().text('%');
					this.controller.find('input').attr('max',100);
					this.controller.find('input').attr('min',0);
					break;
				case 'lineheight':
					this.controller.find('span').first().text('行高さ');
					this.controller.find('span').last().text('px');
					break;
			}
			break;
		case 'fontcolor':
			this.controller=$('<input type="color">').css({
				'border':'1px solid #87ceeb',
				'border-radius':'3px',
				'width':'3em'
			})
			.on('mousedown',function(e){e.stopPropagation();})
			.on('change',function(e){
				/* イベント発火 */
				var event=new $.Event('valuechanged',{value:$(this).val()});
				my.controller.trigger(event);
			});
			break;
		case 'fontfamily':
			this.controller=$('<select>').css({
				'border':'1px solid #87ceeb',
				'border-radius':'3px',
				'width':'13.5em'
			})
			.on('mousedown',function(e){e.stopPropagation();})
			.on('change',function(e){
				/* イベント発火 */
				var event=new $.Event('valuechanged',{value:'\''+$(this).val()+'\''});
				my.controller.trigger(event);
			});
			for (var i=0;i<fonts.length;i++) this.controller.append($('<option value="'+fonts[i]+'">'+fonts[i]+'</option>').css({'font-family':'\''+fonts[i]+'\''}));
			break;
		case 'fontstyle':
		case 'fontweight':
			this.controller=$('<label>').css({
				'border':'none',
				'width':'1.8em'
			})
			.append($('<input type="checkbox">')
				.css({'display':'none'})
				.on('change',function(e){
					var block=$(this).closest('label').find('div');
					if ($(this).prop('checked')) block.css({'background-color':'#FFC578'});
					else block.css({'background-color':'transparent'});
					/* イベント発火 */
					var event=null;
					if (options.type=='fontstyle') event=new $.Event('valuechanged',{value:(($(this).prop('checked'))?'italic':'normal')});
					if (options.type=='fontweight') event=new $.Event('valuechanged',{value:(($(this).prop('checked'))?'bold':'normal')});
					my.controller.trigger(event);
				})
			)
			.append($('<div>').css({
					'background-color':'transparent',
					'border':'none',
					'cursor':'pointer',
					'display':'block',
					'height':'1.8em',
					'line-height':'1.8em',
					'margin':'0px',
					'padding':'0px',
					'text-align':'center',
					'width':'1.8em'
				})
			)
			.on('mousedown',function(e){e.stopPropagation();});
			if (options.type=='fontstyle') this.controller.find('div').css({'font-style':'italic'}).text('I');
			if (options.type=='fontweight') this.controller.find('div').css({'font-weight':'bold'}).text('B');
			break;
		case 'textalign':
			var radio=$('<label>').css({
				'background-color':'transparent',
				'border':'none',
				'display':'inline-block',
				'height':'1.8em',
				'margin':'0px',
				'padding':'0px',
				'vertical-align':'top',
				'width':'1.8em'
			})
			.append($('<input type="radio" name="textaligngroup">')
				.css({'display':'none'})
				.on('change',function(e){
					var checked=$('input[name=textaligngroup]').index($('input[name=textaligngroup]:checked'));
					$.each($('input[name=textaligngroup]'),function(index){
						if (index==checked) $(this).closest('label').find('div').css({'background-color':'#FFC578'});
						else $(this).closest('label').find('div').css({'background-color':'transparent'});
						/* イベント発火 */
						var event=new $.Event('valuechanged',{value:$('input[name=textaligngroup]:checked').val()});
						my.controller.trigger(event);
					});
				})
			)
			.append($('<div>').css({
					'background-color':'transparent',
					'border':'none',
					'cursor':'pointer',
					'display':'block',
					'height':'1.8em',
					'margin':'0px',
					'padding':'0px',
					'width':'1.8em'
				})
			);
			var svg='';
			this.controller=$('<div>').css({
				'margin':'0px',
				'padding':'0px',
				'vertical-align':'top'
			})
			.on('mousedown',function(e){e.stopPropagation();});
			this.controller.append(radio.clone(true));
			this.controller.append(radio.clone(true));
			this.controller.append(radio.clone(true));
			svg='<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="30px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">';
			svg+='<line fill="none" stroke="#000000" stroke-miterlimit="10" x1="15" y1="18" x2="85" y2="18"/>';
			svg+='<line fill="none" stroke="#000000" stroke-miterlimit="10" x1="15" y1="40" x2="57" y2="40"/>';
			svg+='<line fill="none" stroke="#000000" stroke-miterlimit="10" x1="15" y1="62" x2="50" y2="62"/>';
			svg+='<line fill="none" stroke="#000000" stroke-miterlimit="10" x1="15" y1="84" x2="71" y2="84"/>';
			svg+='</svg>';
			this.controller.find('div').eq(0).html(svg).find('svg').css({'height':'1.8em','width':'1.8em'});
			svg='<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="30px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">';
			svg+='<line fill="none" stroke="#000000" stroke-miterlimit="10" x1="15" y1="18" x2="85" y2="18"/>';
			svg+='<line fill="none" stroke="#000000" stroke-miterlimit="10" x1="29" y1="40" x2="71" y2="40"/>';
			svg+='<line fill="none" stroke="#000000" stroke-miterlimit="10" x1="32.5" y1="62" x2="67.5" y2="62"/>';
			svg+='<line fill="none" stroke="#000000" stroke-miterlimit="10" x1="22" y1="84" x2="78" y2="84"/>';
			svg+='</svg>';
			this.controller.find('div').eq(1).html(svg).find('svg').css({'height':'1.8em','width':'1.8em'});
			svg='<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="30px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">';
			svg+='<line fill="none" stroke="#000000" stroke-miterlimit="10" x1="15" y1="18" x2="85" y2="18"/>';
			svg+='<line fill="none" stroke="#000000" stroke-miterlimit="10" x1="43" y1="40" x2="85" y2="40"/>';
			svg+='<line fill="none" stroke="#000000" stroke-miterlimit="10" x1="50" y1="62" x2="85" y2="62"/>';
			svg+='<line fill="none" stroke="#000000" stroke-miterlimit="10" x1="29" y1="84" x2="85" y2="84"/>';
			svg+='</svg>';
			this.controller.find('div').eq(2).html(svg).find('svg').css({'height':'1.8em','width':'1.8em'});
			$.each(this.controller.find('label'),function(index){
				switch (index)
				{
					case 0:
						$(this).find('input').attr('value','left');
						$(this).find('div').css({'text-align':'left'});
						break;
					case 1:
						$(this).find('input').attr('value','center');
						$(this).find('div').css({'text-align':'center'});
						break;
					case 2:
						$(this).find('input').attr('value','right');
						$(this).find('div').css({'text-align':'right'});
						break;
				}
			});
			break;
	}
	this.controller.css({
		'background-color':'transparent',
		'display':'inline-block',
		'height':'1.8em',
		'margin':'0px 0.25em 5px 0.25em',
		'padding':'0px',
		'vertical-align':'top'
	})
};
/* 関数定義 */
fontController.prototype={
	/* 値設定 */
	val:function(value)
	{
		switch (this.type)
		{
			case 'fontblur':
			case 'fontsize':
			case 'fonttransparent':
			case 'lineheight':
				if (this.type=='fonttransparent') this.controller.find('input').val(parseFloat(value)*100);
				else this.controller.find('input').val(parseInt(value));
				break;
			case 'fontcolor':
			case 'fontfamily':
				this.controller.val(value);
				break;
			case 'fontstyle':
			case 'fontweight':
				if (this.type=='fontstyle') this.controller.find('input').prop('checked',(value=='italic'));
				if (this.type=='fontweight') this.controller.find('input').prop('checked',(value=='bold'));
				break;
			case 'textalign':
				this.controller.find('label').val([value]);
				break;
		}
	}
};
/*
*--------------------------------------------------------------------
* listNavigation
* リストナビゲーション管理
*--------------------------------------------------------------------
* parameters
* options @ container        :コンテナ
*         @ direction        :リスト追加位置【bottom:top】
*         @ selected         :リスト選択時追加クラス名
*         @ dragover         :ドラッグ時追加クラス名
*         @ selectedcallback :リスト選択コールバック
* -------------------------------------------------------------------
*/
/* コンストラクタ */
var listNavigation = function(options){
	var options=$.extend({
		container:null,
		direction:'bottom',
		selected:'',
		dragover:'',
		selectedcallback:null,
		draggedcallback:null
	},options);
	if (options.container==null) {alert('リストを指定して下さい。');return;}
	if (options.container.prop('tagName').toLowerCase()!='ul') {alert('リストを指定して下さい。');return;}
	var my=this;
	this.container=options.container;
	this.direction=options.direction;
	this.selected=options.selected;
	this.dragover=options.dragover;
	this.activelist=null;
	this.lists=[];
	/* リストイベント */
	this.container.on('selected',function(e){
		my.activate(e.index);
		if (options.selectedcallback) options.selectedcallback(e.index);
	});
	/* ドラッグイベント */
	this.container.on('dragged',function(e){
		if (options.draggedcallback) options.draggedcallback(e);
	});
};
/* 関数定義 */
listNavigation.prototype={
	/* リスト選択 */
	activate:function(index){
		var my=this;
		this.activelist=this.lists[index];
		$.each(this.lists,function(index){
			if (my.lists[index]==my.activelist) $(my.lists[index]).addClass(my.selected);
			else $(my.lists[index]).removeClass(my.selected);
		});
	},
	/* リスト配置 */
	append:function(classname,value){
		var my=this;
		var list=$('<li class="'+classname+'" draggable="true">'+value+'</li>')
		.css({
			'cursor':'move',
			'overflow':'hidden',
			'text-align':'left',
			'text-overflow':'ellipsis',
			'width':'100%'
		})
		.on('dragstart',function(e){
			var dragevent=e;
			if(e.originalEvent) dragevent=e.originalEvent;
			dragevent.dataTransfer.dropEffect='move';
			dragevent.dataTransfer.effectAllowed='move';
			dragevent.dataTransfer.setData('Text',my.lists.indexOf(dragevent.target).toString());
  		})
		.on('dragenter',function(e){
			var dragevent=e;
			if(e.originalEvent) dragevent=e.originalEvent;
			$(dragevent.target).addClass(my.dragover);
			e.stopPropagation();
			e.preventDefault();
  		})
		.on('dragover',function(e){
			e.stopPropagation();
			e.preventDefault();
		})
		.on('dragleave',function(e){
			var dragevent=e;
			if(e.originalEvent) dragevent=e.originalEvent;
			$(dragevent.target).removeClass(my.dragover);
			e.stopPropagation();
			e.preventDefault();
  		})
		.on('drop',function(e){
			var from=null;
			var to=null;
			var indexes={from:0,to:0};
			var dragevent=e;
			if(e.originalEvent) dragevent=e.originalEvent;
			$(dragevent.target).removeClass(my.dragover);
			from=my.lists[parseInt(dragevent.dataTransfer.getData('Text'))];
			to=dragevent.currentTarget;
			indexes={
				from:my.lists.indexOf(from),
				to:my.lists.indexOf(to),
			};
			if (indexes.from!=indexes.to)
			{
				$(from).insertAfter($(to));
				/* イベント発火 */
				var event=new $.Event('dragged',{from:indexes.from,to:indexes.to});
				my.container.trigger(event);
			}
			e.stopPropagation();
			e.preventDefault();
  		})
		.on('mousedown',function(){
			/* イベント発火 */
			var event=new $.Event('selected',{index:my.lists.indexOf(list[0])});
			my.container.trigger(event);
		});
		if (this.direction=='top') this.container.prepend(list);
		else this.container.append(list);
		this.lists.push(list[0]);
		/* イベント発火 */
		var event=new $.Event('selected',{index:this.lists.length-1});
		this.container.trigger(event);
	},
	/* 削除 */
	delete:function(index){
		var deletelist=this.lists[index];
		this.lists=$.grep(this.lists,function(item,index){return item!=deletelist});
		this.container[0].removeChild(deletelist);
	},
	/* テキスト変更 */
	text:function(index,value){
		$(this.lists[index]).text(value);
	}
};
/* カラーコード変換 */
jQuery.extend({
	toRGBA:function(hex,transparent){
		var color=hex.replace('#','');
		var colors={r:0,g:0,b:0};
		switch (color.length)
		{
			case 3:
				colors.r=parseInt(color.substr(0,1),16);
				colors.g=parseInt(color.substr(1,1),16);
				colors.b=parseInt(color.substr(2,1),16);
				break;
			case 6:
				colors.r=parseInt(color.substr(0,2),16);
				colors.g=parseInt(color.substr(2,2),16);
				colors.b=parseInt(color.substr(4,2),16);
				break;
		}
		return 'rgba('+colors.r+','+colors.g+','+colors.b+','+transparent+')';
	}
});
