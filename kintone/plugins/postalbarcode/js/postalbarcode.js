/*
*--------------------------------------------------------------------
* jQuery-Plugin "postalbarcode"
* Version: 1.0
* Copyright (c) 2018 TIS
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
		limit:500,
		offset:0,
		progress:null,
		config:{},
		records:[]
	};
	var events={
		lists:[
			'app.record.index.show'
		],
		show:[
			'app.record.create.show',
			'app.record.edit.show'
		]
	};
	var functions={
		ismakeable:function(record){
			if (!(vars.config.address in record)) return false;
			if (!(vars.config.zip in record)) return false;
			if (!(vars.config.barcode in record)) return false;
			var address=(record[vars.config.address].value)?record[vars.config.address].value:'';
			var zip=(record[vars.config.zip].value)?record[vars.config.zip].value:'';
			if (zip.match(/00$/g)) zip='';
			return (address.length!=0 && zip.length!=0);
		},
		/* create barcode */
		createbarcode:function(record,type,callback){
			var check=0;
			var counter=0;
			var index=0;
			var canvas=null;
			var context=null;
			var images=$.images();
			var chars={
				from:[],
				to:[],
				check:{'0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'-':10,'CC1':11,'CC2':12,'CC3':13,'CC4':14,'CC5':15,'CC6':16,'CC7':17,'CC8':18},
				conv:{
					'A':['CC1','0'],'B':['CC1','1'],'C':['CC1','2'],'D':['CC1','3'],'E':['CC1','4'],'F':['CC1','5'],'G':['CC1','6'],'H':['CC1','7'],'I':['CC1','8'],
					'J':['CC1','9'],'K':['CC2','0'],'L':['CC2','1'],'M':['CC2','2'],'N':['CC2','3'],'O':['CC2','4'],'P':['CC2','5'],'Q':['CC2','6'],'R':['CC2','7'],
					'S':['CC2','8'],'T':['CC2','9'],'U':['CC3','0'],'V':['CC3','1'],'W':['CC3','2'],'X':['CC3','3'],'Y':['CC3','4'],'Z':['CC3','5']
				}
			};
			/* create barcode text */
			chars.from=record[vars.config.address].value
			.replace(/([一二三四五六七八九十]+)(丁目|丁|番地|番|号|地割|線|の|ノ)/g,'$1@')
			.replace(/一[十]*([一二三四五六七八九十]{1})@/g,'1$1@')
			.replace(/二[十]*([一二三四五六七八九十]{1})@/g,'2$1@')
			.replace(/三[十]*([一二三四五六七八九十]{1})@/g,'3$1@')
			.replace(/四[十]*([一二三四五六七八九十]{1})@/g,'4$1@')
			.replace(/五[十]*([一二三四五六七八九十]{1})@/g,'5$1@')
			.replace(/六[十]*([一二三四五六七八九十]{1})@/g,'6$1@')
			.replace(/七[十]*([一二三四五六七八九十]{1})@/g,'7$1@')
			.replace(/八[十]*([一二三四五六七八九十]{1})@/g,'8$1@')
			.replace(/九[十]*([一二三四五六七八九十]{1})@/g,'9$1@')
			.replace(/十([一二三四五六七八九十]{1})@/g,'1$1@')
			.replace(/一@/g,'1-')
			.replace(/二@/g,'2-')
			.replace(/三@/g,'3-')
			.replace(/四@/g,'4-')
			.replace(/五@/g,'5-')
			.replace(/六@/g,'6-')
			.replace(/七@/g,'7-')
			.replace(/八@/g,'8-')
			.replace(/九@/g,'9-')
			.replace(/十@/g,'10-')
			.replace(/[Ａ-Ｚａ-ｚ]/g,function(s){
				return String.fromCharCode(s.charCodeAt(0)-65248);
			})
			.replace(/[０-９]/g,function(s){
				return String.fromCharCode(s.charCodeAt(0)-65248);
			})
			.toUpperCase()
			.replace(/[&＆\/／･・\.．]/g,'')
			.replace(/[‐－―ー]([0-9]+)/g,'-$1')
			.replace(/[^0-9A-Z-]|[A-Z]{2,}/g,'-')
			.replace(/-{2,}/g,'-')
			.replace(/([0-9]+)F$/g,'$1')
			.replace(/([0-9]+)F([0-9]+)/g,'$1-$2')
			.replace(/-([A-Z]{1})/g,'$1')
			.replace(/([A-Z]{1})-/g,'$1')
			.replace(/^-/g,'')
			.replace(/-$/g,'')
			.split('')
			chars.to=record[vars.config.zip].value.replace(/[０-９]/g,function(s){
				return String.fromCharCode(s.charCodeAt(0)-65248);
			})
			.replace(/[^0-9]/g,'')
			.split('');
			for (var i=0;i<13;i++) chars.to.push('CC4');
			/* calc check digit */
			index=7;
			for (var i=0;i<chars.from.length;i++)
			{
				if (index>chars.to.length-1) break;
				if (chars.from[i].match(/[A-Z]/g))
				{
					var conv=chars.conv[chars.from[i]];
					chars.to[index]=conv[0];
					if (index<chars.to.length-1) chars.to[index+1]=conv[1];
					index++;
				}
				else chars.to[index]=chars.from[i];
				index++;
			}
			for (var i=0;i<chars.to.length;i++) check+=chars.check[chars.to[i]];
			check=19-check%19;
			if (check==19) check=0;
			chars.to.push(Object.keys(chars.check).filter(function(key){return chars.check[key]==check.toString()})[0]);
			/* create barcode image */
			canvas=$('<canvas height="12" width="276">');
			if (canvas[0].getContext)
			{
				context=canvas[0].getContext('2d');
				context.fillStyle='rgb(255,255,255)';
				context.fillRect(0,0,canvas[0].width,canvas[0].height);
				counter=chars.to.length;
				index=0;
				functions.loadimage(context,images['STC'],index,function(){
					for (var i=0;i<chars.to.length;i++)
					{
						index+=12;
						functions.loadimage(context,images[chars.to[i]],index,function(){
							counter--;
							if (counter==0)
							{
								index+=12;
								functions.loadimage(context,images['SPC'],index,function(){
									var datas=atob(canvas[0].toDataURL('image/png').replace(/^[^,]*,/,''));
									var buffer=new Uint8Array(datas.length);
									for (var i=0;i<datas.length;i++) buffer[i]=datas.charCodeAt(i);
									(function(buffer){
										var blob=new Blob([buffer],{type:'image/png'});
										if (type=='list')
										{
											var filedata=new FormData();
											var xhr=new XMLHttpRequest();
											filedata.append('__REQUEST_TOKEN__',kintone.getRequestToken());
											filedata.append('file',blob,'barcode.png');
											xhr.open('POST',encodeURI('/k/v1/file.json'),false);
											xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
											xhr.responseType='multipart/form-data';
											xhr.onload=function(){
												if (xhr.status===200) record[vars.config.barcode].value=[{fileKey:JSON.parse(xhr.responseText).fileKey}];
												if (callback) callback(record);
											};
											xhr.onerror=function(){
												if (callback) callback(record);
											};
											xhr.send(filedata);
										}
										else
										{
											if (vars.config.denydownload!='1')
											{
												var url=window.URL || window.webkitURL;
												var a=document.createElement('a');
												a.setAttribute('href',url.createObjectURL(blob));
												a.setAttribute('target','_blank');
												a.setAttribute('download','barcode.png');
												a.style.display='none';
												document.body.appendChild(a);
												a.click();
												document.body.removeChild(a);
											}
											if (callback) callback(record);
										}
									})(buffer.buffer);
								});
							}
						});
					}
				});
			}
			else
			{
				if (callback) callback(record);
			}
		},
		/* load app datas */
		loaddatas:function(callback){
			var sort='';
			var body={
				app:kintone.app.getId(),
				query:kintone.app.getQueryCondition()
			};
			sort=' order by $id asc limit '+vars.limit.toString()+' offset '+vars.offset.toString();
			body.query+=sort;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(vars.records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(callback);
				else callback();
			},function(error){
				vars.progress.hide();
				swal('Error!',error.message,'error');
			});
		},
		/* load image */
		loadimage:function(context,src,position,callback){
			var image=new Image();
			image.onload=function(){
				context.drawImage(image,position,0);
				callback();
			};
			image.src=src;
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		if (!('zip' in vars.config)) return event;
		if (!('address' in vars.config)) return event;
		if (!('barcode' in vars.config)) return event;
		/* clear elements */
		if ($('.custom-elements-postalbarcode').size()) $('.custom-elements-postalbarcode').remove();
		/* append elements */
		kintone.app.getHeaderMenuSpaceElement().appendChild(
			$('<button type="button" class="kintoneplugin-button-dialog-ok custom-elements-postalbarcode">')
			.text('バーコード生成')
			.on('click',function(e){
				swal({
					title:'確認',
					text:'表示中の一覧の条件に該当するすべてのレコードのバーコードを生成します。宜しいですか？',
					type:'info',
					showCancelButton:true,
					cancelButtonText:'Cancel'
				},
				function(){
					vars.offset=0;
					vars.records=[];
					vars.progress.find('.message').text('一覧データ取得中');
					vars.progress.find('.progressbar').find('.progresscell').width(0);
					vars.progress.show();
					functions.loaddatas(function(){
						var error=false;
						var counter=0;
						var progress=function(){
							counter++;
							if (counter<vars.records.length)
							{
								vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/vars.records.length));
							}
							else
							{
								vars.progress.hide();
								swal({
									title:'登録完了',
									text:'データを登録しました。',
									type:'success'
								},function(){location.reload(true);});
							}
						};
						if (vars.records.length==0)
						{
							vars.progress.hide();
							setTimeout(function(){
								swal('Error!','レコードがありません。','error');
							},500);
							return;
						}
						else vars.progress.find('.message').text('データ登録中');
						for (var i=0;i<vars.records.length;i++)
						{
							if (error) break;
							if (functions.ismakeable(vars.records[i]))
							{
								var record={};
								var body={
									app:kintone.app.getId(),
									id:vars.records[i]['$id'].value,
									record:{}
								};
								$.each(vars.records[i],function(key,values){
									switch (values.type)
									{
										case 'CALC':
										case 'CATEGORY':
										case 'CREATED_TIME':
										case 'CREATOR':
										case 'MODIFIER':
										case 'RECORD_NUMBER':
										case 'STATUS':
										case 'STATUS_ASSIGNEE':
										case 'UPDATED_TIME':
											break;
										default:
											record[key]=values;
											break;
									}
								});
								(function(record,body){
									functions.createbarcode(record,'list',function(record){
										body.record=record;
										kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
											progress();
										},function(error){
											vars.progress.hide();
											swal('Error!',error.message,'error');
											error=true;
										});
									});
								})(record,body);
							}
							else progress();
						}
					});
				});
			})[0]
		);
		vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
		$('body').append(vars.progress);
		return event;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		if (!('zip' in vars.config)) return event;
		if (!('address' in vars.config)) return event;
		if (!('barcode' in vars.config)) return event;
		var events=[];
		events.push('app.record.create.change.'+vars.config.zip);
		events.push('app.record.edit.change.'+vars.config.zip);
		events.push('app.record.index.edit.change.'+vars.config.zip);
		events.push('app.record.create.change.'+vars.config.address);
		events.push('app.record.edit.change.'+vars.config.address);
		events.push('app.record.index.edit.change.'+vars.config.address);
		kintone.events.on(events,function(event){
			if (functions.ismakeable(event.record)) functions.createbarcode(event.record,'show');
			else return event;
		});
	});
})(jQuery,kintone.$PLUGIN_ID);
