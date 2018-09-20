/*
*--------------------------------------------------------------------
* jQuery-Plugin "tabletransfer"
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
		limit:500,
		offset:0,
		button:null,
		progress:null,
		apps:[],
		config:{},
		fieldinfos:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		],
		show:[
			'app.record.detail.show'
		]
	};
	var functions={
		/* copy */
		copy:function(records,app){
			vars.progress.find('.message').text('コピーデータ生成中');
			vars.progress.find('.progressbar').find('.progresscell').width(0);
			vars.progress.show();
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:app.app},function(resp){
				var error=false;
				var counter=0;
				var files=[];
				var mappings=[];
				var bodies=[];
				var progress=function(){
					counter++;
					if (counter<bodies.length)
					{
						vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/bodies.length));
					}
					else
					{
						vars.progress.hide();
						swal({
							title:'コピー完了',
							text:'コピーしました。',
							type:'success'
						},function(){
							window.open(kintone.api.url('/k/', true).replace(/\.json/g,'')+app.app+'/');
						});
					}
				};
				for (var i=0;i<records.length;i++)
				{
					var body=[];
					if (app.tablecode)
					{
						for (var i2=0;i2<records[i][app.tablecode].value.length;i2++)
							body.push({
								body:{app:app.app,record:{}},
								files:[]
							});
					}
					else body.push({
						body:{app:app.app,record:{}},
						files:[]
					});
					/* append lookup mappings fields */
					$.each(resp.properties,function(key,values){
						if (values.lookup)
							$.each(values.lookup.fieldMappings,function(index,values){
								mappings.push(values.field);
							});
					});
					/* setup values */
					$.each(resp.properties,function(key,values){
						if (error) return false;
						/* check field type */
						switch (values.type)
						{
							case 'CALC':
							case 'CATEGORY':
							case 'CREATED_TIME':
							case 'CREATOR':
							case 'GROUP':
							case 'MODIFIER':
							case 'RECORD_NUMBER':
							case 'REFERENCE_TABLE':
							case 'STATUS':
							case 'STATUS_ASSIGNEE':
							case 'SUBTABLE':
							case 'UPDATED_TIME':
								break;
							default:
								if (!values.expression)
									if ($.inArray(values.code,mappings)<0)
									{
										var res=$.fielddefault(values);
										for (var i2=0;i2<body.length;i2++)
										{
											body[i2].body.record[values.code]={value:res.value};
											for (var i3=0;i3<app.fields.length;i3++)
											{
												var field=app.fields[i3];
												var record=(vars.fieldinfos[field.from].tablecode)?records[i][vars.fieldinfos[field.from].tablecode].value[i2].value:records[i];
												if (field.to==values.code) functions.setupvalue(record[field.from],body[i2].body.record[values.code],body[i2].files);
											}
											if (res.error)
											{
												var value=(body[i2].body.record[values.code].value)?body[i2].body.record[values.code].value:null;
												if (!value) value='';
												if (value.length==0)
												{
													vars.progress.hide();
													swal('Error!',res.error,'error');
													error=true;
												}
											}
										}
									}
						}
					});
					if (error) break;
					Array.prototype.push.apply(bodies,body);
				}
				if (!error)
				{
					if (bodies.length>0)
					{
						vars.progress.find('.message').text('コピー中');
						for (var i=0;i<bodies.length;i++)
						{
							functions.setupfilevalue(0,bodies[i].files,function(){
								if (Object.keys(bodies[i].body.record).length!==0)
								{
									kintone.api(kintone.api.url('/k/v1/record',true),'POST',bodies[i].body,function(resp){
										progress();
									},function(error){
										vars.progress.hide();
										swal('Error!',error.message,'error');
									});
								}
							});
						}
					}
					else
					{
						vars.progress.hide();
						swal('Error!','コピーするレコードがありません。','error');
					}
				}
			},function(error){
				vars.progress.hide();
				swal('Error!',error.message,'error');
			});
		},
		/* load app datas */
		loaddatas:function(records,callback){
			var body={
				app:kintone.app.getId(),
				query:kintone.app.getQuery().replace(/limit [0-9]+/g,'').replace(/ offset [0-9]+/g,'')
			};
			body.query+='limit '+vars.limit.toString()+' offset '+vars.offset.toString();
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(records,callback);
				else callback(records);
			},function(error){
				swal('Error!',error.message,'error');
			});
		},
		/* download */
		download:function(fileKey)
		{
			return new Promise(function(resolve,reject)
			{
				var url=kintone.api.url('/k/v1/file',true)+'?fileKey='+fileKey;
				var xhr=new XMLHttpRequest();
				xhr.open('GET',url);
				xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
				xhr.responseType='blob';
				xhr.onload=function(){
					if (xhr.status===200) resolve(xhr.response);
					else reject(Error('File download error:' + xhr.statusText));
				};
				xhr.onerror=function(){
					reject(Error('There was a network error.'));
				};
				xhr.send();
			});
		},
		/* upload */
		upload:function(filename,contentType,data){
			return new Promise(function(resolve,reject)
			{
				var blob=new Blob([data],{type:contentType});
				var filedata=new FormData();
				var xhr=new XMLHttpRequest();
				filedata.append('__REQUEST_TOKEN__',kintone.getRequestToken());
				filedata.append('file',blob,filename);
				xhr.open('POST',encodeURI('/k/v1/file.json'),false);
				xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
				xhr.responseType='multipart/form-data';
				xhr.onload=function(){
					if (xhr.status===200) resolve(xhr.responseText);
					else reject(Error('File upload error:' + xhr.statusText));
				};
				xhr.onerror=function(){
					reject(Error('There was a network error.'));
				};
				xhr.send(filedata);
			});
		},
		setupfilevalue:function(counter,files,callback){
			if (counter<files.length)
			{
				functions.download(files[counter].fileinfo.fileKey).then(function(blob){
					functions.upload(files[counter].fileinfo.name,files[counter].fileinfo.contentType,blob).then(function(resp){
						files[counter].field.value.push({fileKey:JSON.parse(resp).fileKey})
						counter++;
						functions.setupfilevalue(counter,files,callback);
					});
				});
			}
			else callback();
		},
		setupvalue:function(from,to,files){
			switch (from.type)
			{
				case 'FILE':
					to.value=[];
					for (var i=0;i<from.value.length;i++)
						files.push({
							field:to,
							fileinfo:from.value[i]
						})
					break;
				default:
					to.value=from.value;
					break;
			}
		}
	}
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
	vars.button=$('<button type="button" class="custom-elements-tabletransfer">')
	.css({
		'background-color':'#f7f9fa',
		'border':'1px solid #e3e7e8',
		'box-shadow':'1px 1px 1px #fff inset',
		'box-sizing':'border-box',
		'color':'#3498db',
		'cursor':'pointer',
		'display':'inline-block',
		'font-size':'14px',
		'outline':'none',
		'padding':'0px 16px',
		'position':'relative',
		'text-align':'center',
		'vertical-align':'top',
		'white-space':'nowrap'
	});
	kintone.events.on(events.lists,function(event){
		/* get fieldinfo */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			if ('apps' in vars.config) vars.apps=JSON.parse(vars.config['apps']);
			if ($('.custom-elements-tabletransfer').size()) $('.custom-elements-tabletransfer').remove();
			for (var i=0;i<vars.apps.length;i++)
			{
				(function(app){
					kintone.app.getHeaderMenuSpaceElement().appendChild(
						vars.button.clone(true)
						.css({
							'height':'48px',
							'line-height':'48px',
							'margin':'0px 6px 0px 0px'
						})
						.text(app.buttonlabel)
						.on('click',function(e){
							swal({
								title:'確認',
								text:'一括コピーします。宜しいですか？',
								type:'info',
								showCancelButton:true,
								cancelButtonText:'Cancel'
							},
							function(){
								vars.offset=0;
								functions.loaddatas([],function(records){
									functions.copy(records,app);
								});
							});
						})[0]
					);
				})(vars.apps[i]);
			}
			vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
			$('body').append(vars.progress);
		},function(error){swal('Error!',error.message,'error');});
		return event;
	});
	kintone.events.on(events.show,function(event){
		/* get fieldinfo */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			if ('apps' in vars.config) vars.apps=JSON.parse(vars.config['apps']);
			if ($('.custom-elements-tabletransfer').size()) $('.custom-elements-tabletransfer').remove();
			if ($('.gaia-app-statusbar').size()) $('.gaia-app-statusbar').css({'display':'inline-block'});
			for (var i=0;i<vars.apps.length;i++)
			{
				(function(app){
					$('.gaia-argoui-app-toolbar-statusmenu')
					.append(
						vars.button.clone(true)
						.css({
							'height':'40px',
							'line-height':'40px',
							'margin':'3px 6px 0px 0px'
						})
						.text(app.buttonlabel)
						.on('click',function(e){
							functions.copy([event.record],app);
						})
					);
				})(vars.apps[i]);
			}
			vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
			$('body').append(vars.progress);
		},function(error){swal('Error!',error.message,'error');});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
