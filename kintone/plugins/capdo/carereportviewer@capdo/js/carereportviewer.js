/*
*--------------------------------------------------------------------
* jQuery-Plugin "carereportviewer"
* Version: 1.0
* Copyright (c) 2017 TIS
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
		drag:{
			capture:false,
			cells:[],
			keep:{
				column:0,
				container:0,
				position:0
			}
		},
		table:null,
		thumbnail:null,
		columns:[],
		containers:[],
		excludefields:[],
		excludeviews:[],
		verifyfields:[],
		config:{},
		fieldinfos:{}
	};
	var events={
		show:[
			'app.record.index.show'
		]
	};
	var functions={
		/* download file */
		download:function(fileKey){
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
		/* setup value */
		setvalue:function(cell,fieldinfo,values){
			var value=null;
			var unit=(fieldinfo.unit!=null)?fieldinfo.unit:'';
			var unitPosition=(fieldinfo.unitPosition!=null)?fieldinfo.unitPosition.toUpperCase():'BEFORE';
			if (values!=null)
				switch (fieldinfo.type.toUpperCase())
				{
					case 'CALC':
						if (values.length!=0)
						{
							switch(fieldinfo.format.toUpperCase())
							{
								case 'NUMBER':
									value=values;
									break;
								case 'NUMBER_DIGIT':
									value=parseFloat(values).format();
									break;
								case 'DATETIME':
									value=new Date(values.dateformat());
									value=value.format('Y-m-d H:i');
									break;
								case 'DATE':
									value=new Date((values+'T00:00:00+09:00').dateformat());
									value=value.format('Y-m-d');
									break;
								case 'TIME':
									value=new Date(('1900-01-01T'+values+':00+09:00').dateformat());
									value=value.format('H:i');
									break;
								case 'HOUR_MINUTE':
									value=values;
									break;
								case 'DAY_HOUR_MINUTE':
									value=values;
									break;
							}
							if (unitPosition=='BEFORE') value=unit+value;
							else value=value+unit;
							cell.text(value);
						}
						break;
					case 'CATEGORY':
					case 'CHECK_BOX':
					case 'MULTI_SELECT':
						if (values.length!=0)
						{
							value=values.join('<br>');
							cell.html(value);
						}
						break;
					case 'CREATOR':
					case 'MODIFIER':
						if (values.code.length!=0) cell.html('<a href="https://'+$(location).attr('host')+'/k/#/people/user/'+values.code+'" target="_blank">'+values.name+'</a>');
						break;
					case 'CREATED_TIME':
					case 'DATETIME':
					case 'UPDATED_TIME':
						if (values.length!=0)
						{
							value=new Date(values.dateformat());
							cell.text(value.format('Y-m-d H:i'));
						}
						break;
					case 'DATE':
						if (values.length!=0)
						{
							value=new Date((values+'T00:00:00+09:00').dateformat());
							cell.text(value.format('Y-m-d'));
						}
						break;
					case 'FILE':
						if (values.length!=0)
						{
							value=[];
							$.each(values,function(index){
								switch(values[index].contentType)
								{
									case 'image/bmp':
									case 'image/gif':
									case 'image/jpeg':
									case 'image/png':
										value.push($('<img src="" class="carereportviewer-thumbnail" alt="'+values[index].name+'" title="'+values[index].name+'" />')
											.on('click',function(e){
												vars.thumbnail.find('.carereportviewer-image').attr('src',$(this).attr('src'));
												vars.thumbnail.show();
											})
										);
										functions.download(values[index].fileKey).then(function(blob){
											var url=window.URL || window.webkitURL;
											var image=url.createObjectURL(blob);
											value[index].attr('src',url.createObjectURL(blob));
										});
										break;
									default:
										value.push($('<a href="./">'+values[index].name+'</a>')
											.on('click',function(e){
												functions.download(values[index].fileKey).then(function(blob){
													var url=window.URL || window.webkitURL;
													var a=document.createElement('a');
													a.setAttribute('href',url.createObjectURL(blob));
													a.setAttribute('target','_blank');
													a.setAttribute('download',values[index].name);
													a.style.display='none';
													document.body.appendChild(a);
													a.click();
													document.body.removeChild(a);
												});
												return false;
											})
										);
										break;
								}
							});
							$.each(value,function(index){cell.append(value[index]);});
						}
						break;
					case 'LINK':
						if (values.length!=0)
						{
							switch(fieldinfo.protocol.toUpperCase())
							{
								case 'CALL':
									value='<a href="tel:'+values+'" target="_blank">'+values+'</a>';
									break;
								case 'MAIL':
									value='<a href="mailto:'+values+'" target="_blank">'+values+'</a>';
									break;
								case 'WEB':
									value='<a href="'+values+'" target="_blank">'+values+'</a>';
									break;
							}
							cell.html(value);
						}
						break;
					case 'MULTI_LINE_TEXT':
						if (values.length!=0) cell.html(values.replace(/\n/g,'<br>'));
						break;
					case 'NUMBER':
						if (values.length!=0)
						{
							if (fieldinfo.digit) value=parseFloat(values).format();
							else value=values;
							if (unitPosition=='BEFORE') value=unit+value;
							else value=value+unit;
							cell.text(value);
						}
						break;
					case 'GROUP_SELECT':
					case 'ORGANIZATION_SELECT':
						if (values.length!=0)
						{
							value='';
							$.each(values,function(index){
								value+='<span>'+values[index].name+'</span>';
							});
							cell.html(value);
						}
						break;
					case 'RICH_TEXT':
						if (values.length!=0) cell.html(values);
						break;
					case 'STATUS_ASSIGNEE':
					case 'USER_SELECT':
						if (values.length!=0)
						{
							value='';
							$.each(values,function(index){
								value+='<a href="https://'+$(location).attr('host')+'/k/#/people/user/'+values[index].code+'" target="_blank">'+values[index].name+'</a>';
							});
							cell.html(value);
						}
						break;
					case 'TIME':
						if (values.length!=0)
						{
							value=new Date(('1900-01-01T'+values+':00+09:00').dateformat());
							cell.text(value.format('H:i'));
						}
						break;
					default:
						if (values.length!=0) cell.text(values);
						break;
				}
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		if ('excludefield' in vars.config) vars.excludefields=vars.config.excludefield.split(',');
		if ('excludeview' in vars.config) vars.excludeviews=vars.config.excludeview.split(',');
		if ('verifyfield' in vars.config) vars.verifyfields=JSON.parse(vars.config.verifyfield);
		/* check viewid */
		if ($.inArray(event.viewId.toString(),vars.excludeviews)>-1) return event;
		kintone.proxy(
			vars.config['license']+'?domain='+$(location).attr('host').replace(/\.cybozu\.com/g,''),
			'GET',
			{},
			{},
			function(body,status,headers){
				if (status>=200 && status<300)
				{
					var json=JSON.parse(body);
					if (parseInt('0'+json.permit)==0) {swal('Error!','ライセンスが登録されていません。','error');return;}
					/* initialize valiable */
					vars.containers=[];
					/* fixed header */
					var headeractions=$('div.contents-actionmenu-gaia');
					var headerspace=$(kintone.app.getHeaderSpaceElement());
					headeractions.parent().css({'position':'relative'});
					headerspace.parent().css({'position':'relative'});
					$(window).on('load resize scroll',function(e){
						headeractions.css({
							'left':$(window).scrollLeft().toString()+'px',
							'position':'absolute',
							'top':'0px',
							'width':$(window).width().toString()+'px'
						});
						headerspace.css({
							'left':$(window).scrollLeft().toString()+'px',
							'position':'absolute',
							'top':headeractions.outerHeight(false)+'px',
							'width':$(window).width().toString()+'px'
						});
						$('div#view-list-data-gaia').css({'margin-top':(headeractions.outerHeight(false)+headerspace.outerHeight(false))+'px','overflow-x':'visible'});
					});
					/* get views of app */
					kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
						$.each(resp.views,function(key,values){
							if (values.type.toUpperCase()=='LIST' && values.id==event.viewId)
							{
								/* get layout of app */
								kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
									var tablelayout={};
									(function(layouts){
										for (var i=0;i<layouts.length;i++)
										{
											var layout=layouts[i];
											if (layout.type=='SUBTABLE')
											{
												var fields=[];
												for (var i2=0;i2<layout.fields.length;i2++)
												{
													var fieldinfo=layout.fields[i2];
													/* exclude spacer */
													if ($.inArray(fieldinfo.code,vars.excludefields)<0 && !fieldinfo.elementId) fields.push(fieldinfo.code);
												}
												tablelayout[layout.code]=fields;
											}
										}
									})(resp.layout);
									/* get fields of app */
									kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
										var head=$('<tr>');
										var template=$('<tr>');
										var setvalues=function(row,style,record){
											var index=vars.table.rows.index(row);
											var baserow=row.addClass(style);
											var tables=[];
											$.each(record,function(key,values){
												switch (values.type)
												{
													case 'SUBTABLE':
														for (var i=0;i<values.value.length;i++)
														{
															if (tables.length<i) tables.push({});
															$.each(values.value[i].value,function(key,values){
																if (i==0)
																{
																	if (!key.match(/^\$/g))
																		if ($('#'+key,row))
																		{
																			functions.setvalue($('div',$('#'+key,row)),vars.fieldinfos[key],values.value);
																			if (key in vars.verifyfields)
																			{
																				var verify=vars.verifyfields[key];
																				var hit=false;
																				if ($.isNumeric(values.value))
																				{
																					hit=(verify.decision==0)?(parseFloat(values.value)>=parseFloat(verify.value)):(parseFloat(values.value)<=parseFloat(verify.value));
																					if (hit)
																					{
																						$('div',$('#'+key,row)).css({
																							'background-color':'#'+verify.backcolor.replace('#',''),
																							'color':'#'+verify.forecolor.replace('#','')
																						});
																					}
																				}
																			}
																		}
																}
																else tables[i-1][key]=values;
															});
														}
														break;
													default:
														if (!key.match(/^\$/g))
															if ($('#'+key,row)) functions.setvalue($('div',$('#'+key,row)),vars.fieldinfos[key],values.value);
														break;
												}
											});
											if (tables.length!=0)
											{
												for (var i=0;i<tables.length;i++)
													vars.table.insertrow(baserow,function(row){
														baserow=setvalues(row,style,tables[i]);
													});
												$.each($('.notable',row),function(){$(this).attr('rowspan',tables.length+1);});
												for (var i=index+1;i<index+tables.length+1;i++) $('.notable',vars.table.rows.eq(i)).remove();
											}
											if ('$id' in record) $('input',$('.buttoncell',row)).first().val(record['$id'].value);
											return baserow;
										};
										vars.columns=[];
										vars.fieldinfos=resp.properties;
										/* setup columninfos */
										for (var i=0;i<values.fields.length;i++)
										{
											var fieldinfo=vars.fieldinfos[values.fields[i]];
											if (fieldinfo.code in tablelayout)
											{
												for (var i2=0;i2<tablelayout[fieldinfo.code].length;i2++)
													vars.columns.push({
														fieldinfo:fieldinfo.fields[tablelayout[fieldinfo.code][i2]],
														istable:true
													});
											}
											else
											{
												vars.columns.push({
													fieldinfo:fieldinfo,
													istable:false
												});
											}
										}
										/* initialize valiable */
										vars.fieldinfos=$.fieldparallelize(vars.fieldinfos);
										/* append button column */
										head.append($('<th>').append($('<div>').text('')));
										template.append($('<td class="buttoncell notable">')
											.append($('<button class="customview-button edit-button">').on('click',function(){
												var cell=$(this).closest('td');
												var index=$('input',cell).val();
												if (index.length!=0) window.location.href=kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/show#record='+index;
											}))
											.append($('<input type="hidden" value="">'))
										);
										/* append columns */
										for (var i=0;i<vars.columns.length;i++)
										{
											head.append($('<th>').append($('<div>').text(vars.columns[i].fieldinfo.label)));
											if (vars.columns[i].istable) template.append($('<td id="'+vars.columns[i].fieldinfo.code+'">').append($('<div>')));
											else template.append($('<td id="'+vars.columns[i].fieldinfo.code+'" class="notable">').append($('<div>')));
										}
										/* append button column */
										head.append($('<th>').append($('<div>').text('')));
										template.append($('<td class="buttoncell notable">')
											.append($('<button class="customview-button close-button">').on('click',function(){
												var row=$(this).closest('tr');
												var index=$('input',$('td',row).first()).val();
												if (index.length!=0)
												{
													swal({
														title:'確認',
														text:'削除します。\n宜しいですか?',
														type:'warning',
														showCancelButton:true,
														confirmButtonText:'OK',
														cancelButtonText:"Cancel"
													},
													function(){
														var method='DELETE';
														var body={
															app:kintone.app.getId(),
															ids:[index]
														};
														kintone.api(kintone.api.url('/k/v1/records',true),method,body,function(resp){
															var rowindex=vars.table.rows.index(row);
															var rowspan=parseInt('0'+$('td',row).first().attr('rowspan'));
															if (rowspan==0) rowspan=1;
															for (var i=rowindex;i<rowindex+rowspan;i++) vars.table.rows.eq(rowindex).remove();
														},function(error){});
													});
												}
											}))
										);
										/* create table */
										vars.table=$('<table id="carereportviewer" class="customview-table">').mergetable({
											container:$('div#view-list-data-gaia').empty(),
											head:head,
											template:template,
											merge:false
										});
										/* place records */
										for (var i=0;i<event.records.length;i++)
										{
											var record=event.records[i];
											vars.table.insertrow(null,function(row){
												setvalues(row,((i%2==0)?'odd':'even'),record);
											});
										}
										/* append elements */
										vars.thumbnail=$('<div class="imageviewer">').css({
											'background-color':'rgba(0,0,0,0.5)',
											'display':'none',
											'height':'100%',
											'left':'0px',
											'position':'fixed',
											'top':'0px',
											'width':'100%',
											'z-index':'999999'
										})
										.append($('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/close.png">').css({
											'cursor':'pointer',
											'display':'block',
											'height':'30px',
											'margin':'0px',
											'padding':'0px',
											'position':'absolute',
											'right':'5px',
											'top':'5px',
											'width':'30px'
										}))
										.append($('<img class="carereportviewer-image">').css({
											'bottom':'0',
											'box-shadow':'0px 0px 3px rgba(0,0,0,0.35)',
											'display':'block',
											'height':'auto',
											'left':'0',
											'margin':'auto',
											'max-height':'calc(100% - 80px)',
											'max-width':'calc(100% - 80px)',
											'padding':'0px',
											'position':'absolute',
											'right':'0',
											'top':'0',
											'width':'auto'
										}))
										.on('click',function(){vars.thumbnail.hide();});
										$('body').append(vars.thumbnail);
										/* append fix containers */
										$.each(vars.table.container.parents(),function(index){
											var check=$(this).attr('style');
											if (check)
												if (check.indexOf(vars.table.container.width().toString()+'px')>-1) vars.containers.push($(this));
										});
										if (vars.containers.length==0) vars.containers.push($('div#view-list-data-gaia'));
										/* mouse events */
										$(vars.table.container).on('mousemove','td,th',function(e){
											if (vars.drag.capture) return;
											var left=e.pageX-$(this).offset().left;
											var hit=true;
											if (left<$(this).outerWidth(false)-5) hit=false;
											if (left>$(this).outerWidth(false)) hit=false;
											if (hit) $(this).addClass('adjust');
											else $(this).removeClass('adjust');
										});
										$(vars.table.container).on('mousedown','td,th',function(e){
											if (!$(this).hasClass('adjust')) return;
											vars.drag.capture=true;
											vars.drag.keep.column=$(this).outerWidth(false);
											vars.drag.keep.container=vars.containers[0].outerWidth(false);
											vars.drag.keep.position=e.pageX;
											/* setup resize column */
											vars.drag.cells=[];
											$.each($('td,th',vars.table.container),function(index){
												if (e.pageX>$(this).offset().left && e.pageX<$(this).offset().left+$(this).outerWidth(false)) vars.drag.cells.push($(this));
											});
											e.stopPropagation();
											e.preventDefault();
										});
										$(window).on('mousemove',function(e){
											if (!vars.drag.capture) return;
											var width=0;
											width=vars.drag.keep.column+e.pageX-vars.drag.keep.position;
											if (width<15) width=15;
											/* resize column */
											$.each(vars.drag.cells,function(index){
												vars.drag.cells[index].css({'width':width.toString()+'px'});
												vars.drag.cells[index].find('div').css({'width':width.toString()+'px'});
											});
											/* resize container */
											$.each(vars.containers,function(index){
												vars.containers[index].css({'width':(vars.drag.keep.container-vars.drag.keep.column+width).toString()+'px'});
											});
											e.stopPropagation();
											e.preventDefault();
										});
										$(window).on('mouseup',function(e){
											if (!vars.drag.capture) return;
											vars.drag.capture=false;
											e.stopPropagation();
											e.preventDefault();
										});
									},function(error){});
								},function(error){});
							}
						})
					});
				}
				else swal('Error!','ライセンス認証に失敗しました。','error');
			},
			function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
		);
	});
})(jQuery,kintone.$PLUGIN_ID);
