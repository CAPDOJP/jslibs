/*
*--------------------------------------------------------------------
* jQuery-Plugin "graphManager"
* Version: 1.0
* Copyright (c) 2014 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
/*
*--------------------------------------------------------------------
* graphManager
* レイヤー操作コントローラー
*--------------------------------------------------------------------
* parameters
* options	@ canvas		:グラフ描画キャンバス
*			@ type			:グラフタイプ【circle:line】
*			@ scale			:目盛設定
*							{
*								position:【left:right】,
*								width:幅
*							}
*			@ captions		:項目名
*			@ captionformat	:項目名変換関数
*			@ markers		:マーカースタイル
*				ex for circle markers:['#FF0000','#00FF00','#0000FF']
*				ex for line   markers:[
*										{
*											color:'#FF0000',
*											dot:false
*										},
*										{
*											color:'#00FF00',
*											dot:true
*										}
*									]
*			@ values		:データ値
* -------------------------------------------------------------------
*/
/* コンストラクタ */
var graphManager = function(options){
	var options=$.extend({
		canvas:null,
		type:'line',
		scale:{position:'left',width:0},
		captions:[],
		captionformat:null,
		markers:[],
		values:[]
	},options);
	if (options.canvas==null) {alert('キャンバスを指定して下さい。');return;}
	if (options.values.length==0) {alert('データ値を設定して下さい。');return;}
	var my=this;
	/* 変数定義 */
	this.graph=options.canvas;
	this.type=options.type;
	this.scale=options.scale;
	this.captions=options.captions;
	this.captionformat=options.captionformat;
	this.markers=options.markers;
	this.values=options.values;
	this.context=null;
	this.style=null;
	this.maxvalue=Number.MIN_SAFE_INTEGER;
	this.minvalue=Number.MAX_SAFE_INTEGER;
	if (!('position' in this.scale)) this.scale['position']='left';
	if (!('width' in this.scale)) this.scale['width']=0;
	if (this.graph[0].getContext)
	{
		this.context=this.graph[0].getContext('2d');
		switch(this.type)
		{
			case 'circle':
				if (this.values.length!=1) alert('データ値の配列の数を確認して下さい。');
				if (this.markers.length!=this.values[0].length) alert('データ値とマーカスタイルの数が一致しません。');
				break;
			case 'line':
				if (this.captions.length!=this.values[0].length) alert('データ値との項目名の数が一致しません。');
				if (this.markers.length!=this.values.length) alert('データ値とマーカスタイルの数が一致しません。');
				break;
		}
	}
	else alert('本サービスはご利用中のブラウザには対応しておりません。');
};
/* 関数定義 */
graphManager.prototype={
	/* グラフ再描画 */
	redraw:function(){
		var my=this;
		var left=0;
		var top=0;
		var interval=5;
		var pow=0;
		var padding={left:10,right:10,top:10,bottom:10,holizontal:20,vertical:20};
		var path=new Path2D();
		/* 目盛設定初期化 */
		this.maxvalue=Number.MIN_SAFE_INTEGER;
		this.minvalue=Number.MAX_SAFE_INTEGER;
		$.each(this.values,function(index){
			var values=my.values[index];
			$.each(values,function(index){
				if (my.maxvalue<Math.ceil(values[index])) my.maxvalue=Math.ceil(values[index]);
				if (my.minvalue>Math.floor(values[index])) my.minvalue=Math.floor(values[index]);
			});
		});
		if (this.minvalue<0)
		{
			this.maxvalue=Math.max(this.maxvalue,this.minvalue*-1);
			this.minvalue=Math.max(this.maxvalue,this.minvalue*-1)*-1;
		}
		else this.minvalue=0;
		if (this.maxvalue.toString().length>1)
		{
			pow=Math.pow(10,this.maxvalue.toString().length-1);
			this.maxvalue=Math.floor(this.maxvalue/pow)*pow+pow;
			if (this.minvalue<0) this.minvalue=this.maxvalue*-1;
		}
		/* グラフ初期化 */
		this.context.clearRect(0,0,this.graph.width(),this.graph.height());
        this.style=getComputedStyle(this.graph[0]);
		switch(this.type)
		{
			case 'circle':
				var from=0;
				var to=0;
				var radius=((this.graph.width()>this.graph.height())?this.graph.height()-padding.vertical:this.graph.width()-padding.holizontal)/2;
                left=this.graph.width()/2;
                top=this.graph.height()/2;
				/* グラフ描画 */
				$.each(this.values[0],function(index){
					to=from+(my.values[0][index]/100*Math.PI*2);
					path=new Path2D();
					path.moveTo(left,top);
					path.arc(left,top,radius,from-(Math.PI/2),to-(Math.PI/2),false);
					my.context.fillStyle=my.markers[index];
					my.context.fill(path);
					from=to;
				});
				break;
			case 'line':
				var prev='';
				var ratio=0;
				var caption={height:0,width:0};
                var plot={height:0,width:0};
				var scale={height:0,width:0,amount:0};
				padding={left:10,right:15,top:15,bottom:5,holizontal:0,vertical:0,caption:10,scale:10};
		        padding.holizontal=padding.left+padding.right+padding.scale;
		        padding.vertical=padding.top+padding.bottom+padding.caption;
                scale.amount=(this.maxvalue-this.minvalue)/(interval-1);
				if (this.scale.width==0)
				{
					var scalecheck='';
					var scalelength=0;
					for (var i=0;i<interval;i++)
					{
						scalecheck=(this.maxvalue-(scale.amount*i)).toFixed(10).replace(/[0]+$/g,'').replace(/.$/g,'');
						if (scalelength<scalecheck.length) scalelength=scalecheck.length;
					}
					scale.width=scalelength*parseFloat(this.style.fontSize);
				}
				else scale.width=this.scale.width;
				scale.height=(this.graph.height()-parseFloat(this.style.fontSize)*2-padding.vertical)/(interval-1);
                plot.height=this.graph.height()-parseFloat(this.style.fontSize)*2-padding.vertical;
                plot.width=this.graph.width()-padding.holizontal-scale.width;
				caption.height=parseFloat(this.style.fontSize)*2+padding.caption;
				caption.width=plot.width/this.captions.length;
				/* 描画設定 */
				this.context.font=this.style.fontStyle+' '+this.style.fontVariant+' '+this.style.fontWeight+' '+(parseFloat(this.style.fontSize)*0.75)+'px '+this.style.fontFamily;
				this.context.lineCap='round';
				this.context.lineJoin='round';
				this.context.textBaseline='middle';
				this.context.translate(0.5,0.5);
				if (this.scale.position=='left')
				{
					/* 目盛描画 */
	                left=scale.width+padding.left;
	                top=padding.top;
					for (var i=0;i<interval;i++)
					{
	                    /* 補助線 */
	                    this.line('holizontal',left+padding.scale,top,plot.width,1,this.style.color,((i==interval-1)?0:2));
	                    /* 目盛 */
						this.context.textAlign='right';
						this.context.fillText(this.maxvalue-(scale.amount*i),left,top,scale.width);
						top+=scale.height;
					}
	                /* 補助線 */
	                this.line('vertical',left+padding.scale,padding.top,plot.height,1,this.style.color,0);
				}
				else
				{
					/* 目盛描画 */
	                left=plot.width+padding.left+padding.scale;
	                top=padding.top;
					for (var i=0;i<interval;i++)
					{
	                    /* 補助線 */
	                    this.line('holizontal',padding.left,top,plot.width,1,this.style.color,((i==interval-1)?0:2));
	                    /* 目盛 */
						this.context.textAlign='left';
						this.context.fillText(this.maxvalue-(scale.amount*i),left,top,scale.width);
						top+=scale.height;
					}
	                /* 補助線 */
	                this.line('vertical',plot.width+padding.left,padding.top,plot.height,1,this.style.color,0);
				}
                /* 見出し描画 */
                left=((this.scale.position=='left')?(scale.width+padding.scale):0)+(caption.width/2)+padding.left;
                top=plot.height+(((caption.height/2)-(parseFloat(this.style.fontSize)*0.75))/2)+padding.top+padding.caption;
                $.each(this.captions,function(index){
                	var texts=((my.captionformat!=null)?my.captionformat(prev,my.captions[index]):my.captions[index]).split(/\r\n|\r|\n/);
                    my.context.textAlign='center';
                    for (var i=0;i<texts.length;i++) my.context.fillText(texts[i],left,top+(parseFloat(my.style.fontSize)*i),caption.width);
                    left+=caption.width;
                    prev=my.captions[index];
                });
				/* グラフ描画 */
				$.each(this.values,function(index){
					var values=my.values[index];
					path=new Path2D();
					ratio=(my.maxvalue/(my.maxvalue-my.minvalue))-(values[0]/(my.maxvalue-my.minvalue));
					left=((my.scale.position=='left')?(scale.width+padding.scale):0)+(caption.width/2)+padding.left;
					path.moveTo(left,plot.height*ratio+padding.top);
					$.each(values,function(index){
						if (index!=0)
						{
							ratio=(my.maxvalue/(my.maxvalue-my.minvalue))-(values[index]/(my.maxvalue-my.minvalue));
							path.lineTo(left,plot.height*ratio+padding.top);
							path.moveTo(left,plot.height*ratio+padding.top);
						}
						left+=caption.width;
					});
					my.context.lineWidth=1;
					my.context.strokeStyle=my.markers[index].color;
					my.context.translate(0.5,0.5);
					if (my.markers[index].dot)
					{
						my.context.setLineDash([5]);
						my.context.lineDashOffset=3;
					}
					else my.context.setLineDash([]);
					my.context.stroke(path);
				});
				break;
		}
	},
    /* 罫線 */
    line:function(type,left,top,distance,width,color,dot){
        var path=new Path2D();
        path.moveTo(left,top);
        switch (type)
        {
            case 'holizontal':
                path.lineTo(left+distance,top);
                break;
            case 'vertical':
                path.lineTo(left,top+distance);
                break;
        }
        this.context.lineWidth=width;
        this.context.strokeStyle=color;
        if (dot!=0)
        {
            this.context.setLineDash([dot]);
            this.context.lineDashOffset=dot;
        }
        else this.context.setLineDash([]);
        this.context.stroke(path);
    }
};