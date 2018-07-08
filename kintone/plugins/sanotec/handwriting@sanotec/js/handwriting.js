/*
*--------------------------------------------------------------------
* jQuery-Plugin "handwriting"
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
		capture:false,
		container:null,
		canvas:null,
		context:null,
		height:0,
		width:0,
		config:{},
		params:[]
	};
	var events={
		show:[
			'app.record.detail.show'
		]
	};
	var functions={
		redraw:function(){
			vars.context.clearRect(0,0,vars.width,vars.height);
			for (var i=0;i<vars.params.length;i++)
			{
				var param=vars.params[i];
				var path=new Path2D();
				/* ready for draw */
				vars.context.globalCompositeOperation=param.globalCompositeOperation;
				vars.context.lineCap=param.lineCap;
				vars.context.lineJoin=param.lineJoin;
				vars.context.lineWidth=param.lineWidth;
				vars.context.shadowBlur=param.shadowBlur;
				vars.context.shadowColor=param.shadowColor;
				vars.context.strokeStyle=param.strokeStyle;
				/* draw */
				for (var i2=0;i2<param.path.length;i2++)
				{
					switch(param.path[i2].type)
					{
						case 'm':
							path.moveTo(param.path[i2].x,param.path[i2].y);
							break;
						case 'l':
							path.lineTo(param.path[i2].x,param.path[i2].y);
							break;
					}
				}
				path.moveTo(param.path[param.path.length-1].x,param.path[param.path.length-1].y);
				path.closePath();
				vars.context.stroke(path);
			}
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if (vars.config['space'])
		{
			var clear=$('<button type="button" class="kintoneplugin-button-normal">').text('消す');
			var save=$('<button type="button" class="kintoneplugin-button-dialog-ok">').text('保存');
			vars.container=$(kintone.app.record.getSpaceElement(vars.config['space'])).empty();
			vars.height=parseInt(vars.container.closest('.control-spacer-field-gaia').css('min-height'));
			vars.width=parseInt(vars.container.closest('.control-spacer-field-gaia').css('min-width'));
			vars.canvas=$('<canvas height="'+vars.height+'" width="'+vars.width+'">').on('touchstart mousedown',function(e){
				var event=((e.type.match(/touch/g)))?e.originalEvent.touches[0]:e;
				var left=event.pageX-vars.canvas.offset().left;
				var top=event.pageY-vars.canvas.offset().top;
				/* drawstart */
				vars.capture=true;
				/* setup drawparams */
				vars.params.push({
					path:[],
					globalCompositeOperation:'source-over',
					lineCap:'round',
					lineJoin:'round',
					lineWidth:2,
					shadowBlur:0,
					shadowColor:'rgba(0,0,0,0)',
					strokeStyle:'rgba(0,0,0,1)'
				});
				vars.params[vars.params.length-1].path.push({type:'m',x:left,y:top});
				/* redraw */
				functions.redraw();
				e.stopPropagation();
				e.preventDefault();
			});
			vars.context=vars.canvas[0].getContext('2d');
			$(window).on('touchmove mousemove',function(e){
				if (!vars.capture) return;
				var event=((e.type.match(/touch/g)))?e.originalEvent.touches[0]:e;
				var left=0;
				var top=0;
				/* draw */
				left=event.pageX-vars.canvas.offset().left;
				top=event.pageY-vars.canvas.offset().top;
				if (left<0) return;
				if (left>vars.canvas.width()) return;
				if (top<0) return;
				if (top>vars.canvas.height()) return;
				/* setup drawparams */
				vars.params[vars.params.length-1].path.push({type:'l',x:left,y:top});
				/* redraw */
				functions.redraw();
				e.stopPropagation();
			    e.preventDefault();
			});
			$(window).on('touchend mouseup',function(e){
				if (!vars.capture) return;
				/* drawend */
				vars.capture=false;
				/* redraw */
				functions.redraw();
				e.stopPropagation();
			    e.preventDefault();
			});
			vars.container
			.append(vars.canvas.css({'border':'1px dotted #000000','cursor':'crosshair','display':'block','margin-bottom':'10px'}))
			.append(clear.css({'margin-right':'10px'}).on('click',function(){
				vars.context.clearRect(0,0,vars.width,vars.height);
			}))
			.append(save.on('click',function(){
				var canvas=$('<canvas height="'+vars.height+'" width="'+vars.width+'">');
				var context=canvas[0].getContext('2d');
				var image=new Image();
				image.onload=function(){
					context.globalAlpha=1;
					context.fillStyle='#ffffff';
					context.fillRect(0,0,vars.width,vars.height);
					context.globalAlpha=0.5;
					context.drawImage(image,(vars.width-image.width)/2,(vars.height-image.height)/2);
					context.globalAlpha=1;
					context.fillStyle='#000000';
					context.font="14px sans-serif";
					context.textAlign='right';
					context.textBaseline='middle';
					context.fillText(new Date().format('Y-m-d H:i:s'),vars.width-6,vars.height-14);
					context.drawImage(
						vars.canvas[0],
						0,
						0,
						vars.width,
						vars.height,
						0,
						0,
						vars.width,
						vars.height
					);
					context.setTransform(1,0,0,1,0,0);
					(function(image){
						var buffer=(function(buffer){
							for (var i=0;i<image.length;i++) buffer[i]=image.charCodeAt(i);
							return buffer.buffer;
						})(new Uint8Array(image.length));
						var blob=new Blob([buffer],{type:'image/png'});
						var filedata=new FormData();
						var xhr=new XMLHttpRequest();
						filedata.append('__REQUEST_TOKEN__',kintone.getRequestToken());
						filedata.append('file',blob,'sign.png');
						xhr.open('POST',encodeURI('/k/v1/file.json'),false);
						xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
						xhr.onload=function(){
							if (xhr.status===200)
							{
								var body={
									app:kintone.app.getId(),
									id:event.record['$id'].value,
									record:{}
								};
								body.record[vars.config['file']]={value:[{fileKey:JSON.parse(xhr.responseText).fileKey}]};
								kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
									window.location.reload(true);
								},function(error){
									swal('Error!',error.message,'error');
								});
							}
						};
						xhr.onerror=function(){};
						xhr.send(filedata);
					})(atob(canvas[0].toDataURL('image/png').replace(/^[^,]*,/,'')));
					canvas.remove();
				};
				image.src=vars.config['image'];
			}));
		}
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
