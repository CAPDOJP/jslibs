/*
*--------------------------------------------------------------------
* jQuery-Plugin "qrreader"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		ismobile:false,
		qrreader:null,
		fields:[],
		config:{}
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show',
			'mobile.app.record.create.show',
			'mobile.app.record.edit.show'
		]
	};
	var QRReader=function(){
		var my=this;
		var div=$('<div>').css({
			'box-sizing':'border-box'
		});
		/* append elements */
		this.cover=div.clone(true).css({
			'background-color':'rgba(0,0,0,0.5)',
			'display':'none',
			'height':'100%',
			'left':'0px',
			'position':'fixed',
			'top':'0px',
			'width':'100%',
			'z-index':'999999'
		});
		this.container=div.clone(true).css({
			'background-color':'#FFFFFF',
			'bottom':'0',
			'border-radius':'5px',
			'box-shadow':'0px 0px 3px rgba(0,0,0,0.35)',
			'height':'640px',
			'left':'0',
			'margin':'auto',
			'max-height':'calc(100% - 1em)',
			'max-width':'calc(100% - 1em)',
			'padding':'5px 5px 45px 5px',
			'position':'absolute',
			'right':'0',
			'top':'0',
			'width':'600px'
		});
		this.contents=div.clone(true).css({
			'height':'100%',
			'margin':'0px',
			'overflow':'hidden',
			'padding':'0px',
			'position':'relative',
			'width':'100%',
			'z-index':'888'
		});
		this.buttons=div.clone(true).css({
			'background-color':'#3498db',
			'border-bottom-left-radius':'5px',
			'border-bottom-right-radius':'5px',
			'bottom':'0px',
			'left':'0px',
			'padding':'5px',
			'position':'absolute',
			'text-align':'center',
			'width':'100%',
			'z-index':'999'
		});
		$('body').append(
			this.cover.append(
				this.container
				.append(
					this.contents
					.append(
						$('<video muted playsinline>').attr('id','qrvideo')
						.css({
							'box-sizing':'border-box',
							'height':'100%',
							'width':'100%'
						})
					)
				)
				.append(
					this.buttons
					.append(
						$('<button>').css({
							'background-color':'transparent',
							'border':'none',
							'box-sizing':'border-box',
							'color':'#FFFFFF',
							'cursor':'pointer',
							'font-size':'13px',
							'height':'auto',
							'line-height':'30px',
							'margin':'0px',
							'outline':'none',
							'padding':'0px 1em',
							'vertical-align':'top',
							'width':'auto'
						})
						.text('キャンセル')
						.on('click',function(){my.hide();})
					)
				)
			)
		);
	};
	QRReader.prototype={
		/* show reader */
		show:function(target){
			var my=this;
			var video=document.getElementById('qrvideo');
			var getqrcode=function(){
				if (video.autoplay)
					setTimeout(function(){
						var canvas=document.createElement('canvas');
						canvas.height=video.offsetHeight;
						canvas.width=video.offsetWidth;
						canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
						qrcode.callback=function(resp){
							if (resp instanceof Error) getqrcode();
							else
							{
								var array=(function(str){
									var arr=[];
									for (var i=0;i<str.length;i++)
										arr.push(str.charCodeAt(i));
									return arr;
								})(unescape(resp));
								target.val(Encoding.codeToString(Encoding.convert(array,'UNICODE',Encoding.detect(array))));
								my.hide();
							}
						};
						qrcode.decode(canvas.toDataURL('image/png'));
					},250);
			};
			var getstream=function(){
				var constraints=(vars.ismobile)?{audio:false,video:{facingMode:{exact:'environment'}}}:{audio:false,video:true};
				var getstream=function(){
					return new Promise(function(resolve,reject){navigator.getUserMedia(constraints,resolve,reject);});
				};
				if (navigator.mediaDevices)
				{
					if ('getUserMedia' in navigator.mediaDevices) return navigator.mediaDevices.getUserMedia(constraints);
					else getstream();
				}
				else
				{
					if (navigator.getUserMedia) getstream();
					else return new Promise(function(resolve,reject){reject(Error('現在利用中のブラウザはストリーミング機能をサポートしておりません。'))});
				}
			};
			video.autoplay=true;
			getstream()
			.then(function(stream){
				video.srcObject=stream;
				getqrcode();
				my.cover.show();
			})
			.catch(function(e){alert(e);})
		},
		/* hide reader */
		hide:function(){
			var video=document.getElementById('qrvideo');
			video.autoplay=false;
			this.cover.hide();
		}
	};
	var functions={
		device:function(){
			var ua=navigator.userAgent;
			if (ua.indexOf('iPhone')>0 || ua.indexOf('iPod')>0 || ua.indexOf('Android')>0 && ua.indexOf('Mobile')>0 || ua.indexOf('Windows Phone')>0) return 'sp';
			if (ua.indexOf('iPad')>0 || ua.indexOf('Android')>0) return 'tab';
			return 'other';
		},
		setupbutton:function(field){
			$.each($('body').fields(field),function(index){
				var parent=$(this).closest('div');
				var target=$(this);
				var rects={
					parent:parent[0].getBoundingClientRect(),
					target:target[0].getBoundingClientRect()
				};
				if ($.data(target[0],'added')==null) $.data(target[0],'added',false);
				if ($.data(target[0],'added')) return true;
				target.css({
					'padding-right':target.outerHeight(false).toString()+'px',
					'position':'relative',
					'z-index':'1'
				});
				parent.css({'position':'relative'})
				.append(
					$('<img>').css({
						'background-color':'transparent',
						'border':'none',
						'box-sizing':'border-box',
						'cursor':'pointer',
						'display':'block',
						'height':target.outerHeight(false).toString()+'px',
						'margin':'0px',
						'position':'absolute',
						'right':(rects.parent.right-rects.target.right).toString()+'px',
						'top':((rects.parent.top-rects.target.top)*-1).toString()+'px',
						'width':target.outerHeight(false).toString()+'px',
						'z-index':'2'
					})
					.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAYAAACAvzbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpCRUM2REQ0RjgwMUVFNzExOTM5RDhEMTVGNDJCRkUxQiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpDNzExODg3QzVFMTgxMUU4ODVGMUNDODQwN0NGQjFCNiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpDNzExODg3QjVFMTgxMUU4ODVGMUNDODQwN0NGQjFCNiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkZCRTRBOTkxRkM4NkU3MTE4NEIyQzQzRTFBQzY3OURBIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkJFQzZERDRGODAxRUU3MTE5MzlEOEQxNUY0MkJGRTFCIi8+IDwvcmRmOkRlc2NyaXB0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')
					.on('click',function(){vars.qrreader.show($(this).closest('div').find('input'));})
				);
			});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if (!('fields' in vars.config)) return event;
		/* check device */
		vars.ismobile=event.type.match(/mobile/g);
		if (!vars.ismobile) vars.ismobile=(functions.device()!='other');
		/* initialize valiable */
		vars.qrreader=new QRReader();
		vars.fields=JSON.parse(vars.config['fields']);
		/* setup buttons */
		for (var i=0;i<vars.fields.length;i++)
		{
			var field=vars.fields[i];
			functions.setupbutton(field.code);
			if (field.tablecode.length!=0)
			{
				var events=[];
				events.push('app.record.create.change.'+field.tablecode);
				events.push('app.record.edit.change.'+field.tablecode);
				(function(field,events){
					kintone.events.on(events,function(event){
						functions.setupbutton(field.code);
						return event;
					});
				})(field,events)
			}
		}
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
