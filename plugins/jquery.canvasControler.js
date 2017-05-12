/*
*--------------------------------------------------------------------
* jQuery-Plugin "canvasControler"
* Version: 1.0
* Copyright (c) 2014 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
/*
*--------------------------------------------------------------------
* canvasControler
* 移動量調整コントローラー
*--------------------------------------------------------------------
* parameters
* options @ container :コンテナ
*         @ linewidth :描画線太さ
* -------------------------------------------------------------------
*/
/* コンストラクタ */
var canvasControler = function(options){
	var options=$.extend({
		container:null,
		linewidth:1
	},options);
	if (options.container==null) {alert('描画用ボックスを指定して下さい。');return;}
	var my=this;
	var target=options.container;
	var capture=false;
	var draw={
		left:0,
		top:0
	};
	var keep={
		left:0,
		top:0
	};
	this.canvas=target;
	this.context=null;
	this.isready=false;
	this.brushBlur=0;
	this.brushColor={r:0,g:0,b:0};
	this.brushTransparency=1;
	this.brushWidth=options.linewidth;
	if (target[0].getContext)
	{
		my.context=my.canvas[0].getContext('2d');
		/*
		*------------------------------------------------------------
		* フリーハンド操作
		*------------------------------------------------------------
		*/
		my.canvas.on('mousedown',function(e){
	    	if (!my.isready) return;
	    	capture=true;
			keep.left=e.clientX-my.canvas.offset().left;
			keep.top=e.clientY-my.canvas.offset().top;
			/* 描画設定 */
			my.context.lineCap='round';
			my.context.lineJoin='round';
			my.context.lineWidth=my.brushWidth;
			my.context.strokeStyle='rgba('+my.brushColor.r+','+my.brushColor.g+','+my.brushColor.b+','+my.brushTransparency+')';
			my.context.shadowColor='rgba('+my.brushColor.r+','+my.brushColor.g+','+my.brushColor.b+','+my.brushTransparency+')';
			my.context.shadowBlur=my.brushBlur;
			e.preventDefault();
		});
		$(window).on('mousemove',function(e){
	    	if (!my.isready) return;
			if (!capture) return;
			draw.left=e.clientX-my.canvas.offset().left;
			draw.top=e.clientY-my.canvas.offset().top;
			if (draw.left<0) return;
			if (draw.left>my.canvas.width()) return;
			if (draw.top<0) return;
			if (draw.top>my.canvas.height()) return;
			my.context.beginPath();
			my.context.moveTo(keep.left,keep.top);
			my.context.lineTo(draw.left,draw.top);
			my.context.closePath();
			my.context.stroke();
			keep.left=draw.left;
			keep.top=draw.top;
			e.preventDefault();
		});
		$(window).on('mouseup',function(e){
	    	if (!my.isready) return;
			capture=false;
	        e.preventDefault();
		});
	}
	else alert('本サービスはご利用中のブラウザには対応しておりません。');
};
/* 関数定義 */
canvasControler.prototype={
	/* 描画内容クリア */
	clear:function(){
		this.context.clearRect(0, 0,this.canvas.width(),this.canvas.height());
	},
	/* 保存 */
	save:function(options){
		var options=$.extend({
			background:'',
			images:[]
		},options);
		var origin={
			canvas:this.canvas,
			context:this.context
		};
		var clone={
			canvas:null,
			context:null
		};
		var res=null;
		clone.canvas=$('<canvas height="'+origin.canvas.height()+'" width="'+origin.canvas.width()+'">');
		clone.context=clone.canvas[0].getContext('2d');
		clone.context.clearRect(0,0,clone.canvas.width(),clone.canvas.height());
		if (options.background.length!=0)
		{
			clone.context.fillStyle=options.background;
			clone.context.fillRect(0,0,origin.canvas.width(),origin.canvas.height());
		}
		$.each(options.images,function(index){
			var image=options.images[index];
			if (image.src.isVisible())
				clone.context.drawImage(
					image.src[0],
					0,
					0,
					image.width,
					image.height,
					image.src.offset().left-origin.canvas.offset().left,
					image.src.offset().top-origin.canvas.offset().top,
					image.width*(image.zoom/100),
					image.height*(image.zoom/100)
				);
		});
		clone.context.drawImage(origin.canvas[0],0,0);
		res=clone.canvas[0].toDataURL('image/png');
		clone.canvas.remove();
		return res;
	},
	/* カラーコード変換 */
	toRGB:function(hex){
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
		return colors;
	}
};
