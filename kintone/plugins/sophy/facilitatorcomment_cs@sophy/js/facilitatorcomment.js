/*
*--------------------------------------------------------------------
* jQuery-Plugin "facilitatorcomment"
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
		container:null,
		drag:{
			capture:false,
			cells:[],
			keep:{
				column:0,
				container:0,
				position:0
			}
		},
		grid:null,
		header:null,
		inputform:null,
		rows:null,
		template:null,
		thumbnail:null,
		containers:[],
		excludefields:[],
		apps:{},
		config:{},
		offset:{},
		fieldcodes:{},
		tablecodes:{}
	};
	var events={
		show:[
			'app.record.index.show'
		]
	};
	var limit=500;
	var functions={
		/* add columns */
		addcolumns:function(fieldinfo,istable){
			switch (fieldinfo.type)
			{
				case 'SUBTABLE':
					if (fieldinfo.code in vars.tablecodes)
					{
						$.each(vars.tablecodes[fieldinfo.code],function(index){
							functions.addcolumns(fieldinfo.fields[vars.tablecodes[fieldinfo.code][index]],true);
						});
					}
					break;
				default:
					if ($.inArray(fieldinfo.code,vars.excludefields)<0)
					{
						vars.header.append($('<th>').append($('<div>').text(fieldinfo.label)));
						vars.template.append($('<td>').append($('<div>')));
						vars.fieldcodes[fieldinfo.code]={
							isTable:istable,
							fieldinfo:fieldinfo
						};
					}
					break;
			}
		},
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
		/* get field sorted index */
		fieldsort:function(layout){
			var codes=[];
			$.each(layout,function(index,values){
				switch (values.type)
				{
					case 'ROW':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if ($.inArray(values.code,vars.excludefields)<0 && !values.elementId) codes.push(values.code);
						});
						break;
					case 'GROUP':
						$.merge(codes,functions.fieldsort(values.layout));
						break;
					case 'SUBTABLE':
						codes.push(values.code);
						break;
				}
			});
			return codes;
		},
		/* reload datas */
		loaddatas:function(appkey,callback){
			var query=kintone.app.getQueryCondition();
			var body={
				app:appkey,
				query:'',
				fields:vars.fields
			};
			query+=((query.length!=0)?' and ':'');
			query+='absence=0 and staffname=""';
			query+=' order by studentcode asc,date desc,starttime asc limit '+limit.toString()+' offset '+vars.offset[appkey].toString();
			body.query+=query;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[appkey]==null) vars.apps[appkey]=resp.records;
				else Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=limit;
				if (resp.records.length==limit) functions.loaddatas(appkey,callback);
				else callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		},
		/* get table sorted index */
		tablesort:function(layout){
			var codes=[];
			$.each(layout,function(index,values){
				if (values.type=='SUBTABLE')
				{
					codes=[];
					$.each(values.fields,function(index,values){
						/* exclude spacer */
						if ($.inArray(values.code,vars.excludefields)<0 && !values.elementId) codes.push(values.code);
					});
					if (codes.length!=0) vars.tablecodes[values.code]=codes;
				}
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
										value.push($('<img src="" class="facilitatorcomment-thumbnail" alt="'+values[index].name+'" title="'+values[index].name+'" />')
											.on('click',function(e){
												vars.thumbnail.find('.facilitatorcomment-image').attr('src',$(this).attr('src'));
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
													a.href=url.createObjectURL(blob);
													a.download=values[index].name;
													a.click();
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
		/* check viewid */
		if (event.viewId!=vars.config.facilitatorslist) return;
		/* initialize valiable */
		vars.container=$('div#facilitatorcomment-container');
		vars.grid=$('<table id="facilitatorcomment" class="customview-table">');
		vars.header=$('<tr>');
		vars.rows=$('<tbody>');
		vars.template=$('<tr>');
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
		.append($('<img class="facilitatorcomment-image">').css({
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
		vars.containers=[];
		if ('excludefield' in vars.config) vars.excludefields=vars.config.excludefield.split(',');
		/* get table layout */
		kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
			var sorted=functions.fieldsort(resp.layout);
			functions.tablesort(resp.layout);
			/* create grid */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				var fieldinfo=resp.properties;
				/* append button column */
				vars.header.append($('<th>').text(''));
				vars.template.append($('<td class="buttoncell">')
					.append($('<button class="customview-button edit-button">').on('click',function(){
						var row=$(this).closest('tr');
						var index=row.find('td').first().find('input').val();
						if (index.length!=0)
						{
							var fields=[];
							fields.push(resp.properties[vars.config.facilitator]);
							fields.push(resp.properties[vars.config.facilitatorcomment]);
							vars.inputform=$('body').fieldsform({
								buttons:{
									ok:{
										text:'OK'
									},
									cancel:{
										text:'キャンセル'
									}
								},
								fields:fields
							});
							vars.inputform.show({
								buttons:{
									ok:function(){
										var body={
											app:kintone.app.getId(),
											id:index,
											record:{}
										};
										/* close inputform */
										vars.inputform.hide();
										for (var i=0;i<fields.length;i++)
										{
											var fieldinfo=fields[i];
											var contents=$('#'+fieldinfo.code,vars.inputform.contents);
											var receivevalue=contents.find('.receiver').val();
											if (receivevalue.length==0)
											{
												swal('Error!',contents.find('.title').text()+'を入力して下さい。','error');
												return;
											}
											else body.record[fieldinfo.code]={value:receivevalue};
										}
										kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
											location.reload();
										},function(error){
											swal('Error!',error.message,'error');
										});
									},
									cancel:function(){
										/* close inputform */
										vars.inputform.hide();
										swal('Error!','各項目を入力して下さい。','error');
									}
								},
								values:{}
							});
						}
					}))
					.append($('<input type="hidden" value="">'))
				);
				/* append columns */
				$.each(sorted,function(index){
					if (sorted[index] in fieldinfo) functions.addcolumns(fieldinfo[sorted[index]],false);
				});
				/* create row */
				var rowcounter=0;
				vars.apps[kintone.app.getId()]=null;
				vars.offset[kintone.app.getId()]=0;
				functions.loaddatas(kintone.app.getId(),function(){
					var records=vars.apps[kintone.app.getId()];
					$.each(records,function(index,values){
						var record=values
						var cellindex=0;
						var rowindex=0;
						var rows=[vars.template.clone(true)];
						var keys=Object.keys(vars.fieldcodes);
						/* setup field values */
						rows[rowindex].find('td').first().find('input').val(record['$id'].value);
						$.each(record,function(key,values){
							switch (values.type)
							{
								case 'SUBTABLE':
									if (key in vars.tablecodes)
										$.each(values.value,function(index,values){
											if (rowindex>rows.length-1)
											{
												/* append row */
												rows.push(vars.template.clone(true));
												rows[rowindex].find('td').first().find('button').hide();
												rows[rowindex].find('td').last().find('button').hide();
											}
											$.each(values.value,function(key,values){
												if (keys.indexOf(key)>-1) functions.setvalue(rows[rowindex].find('td').eq(keys.indexOf(key)+1).find('div'),vars.fieldcodes[key].fieldinfo,values.value);
											});
											rowindex++;
										});
									break;
								default:
									if (keys.indexOf(key)>-1) functions.setvalue(rows[rowindex].find('td').eq(keys.indexOf(key)+1).find('div'),vars.fieldcodes[key].fieldinfo,values.value);
									break;
							}
							rowindex=0;
						});
						/* append row */
						$.each(rows,function(index){
							cellindex=1;
							rowindex=index;
							/* concat cells */
							$.each(keys,function(index){
								if (rowindex==0)
								{
									if (!vars.fieldcodes[keys[index]].isTable) rows[rowindex].find('td').eq(index+1).attr('rowspan',rows.length);
								}
								else
								{
									if (!vars.fieldcodes[keys[index]].isTable) rows[rowindex].find('td').eq(cellindex).remove();
									else cellindex++;
								}
							});
							if (rowindex==0)
							{
								rows[rowindex].find('td').first().attr('rowspan',rows.length);
								rows[rowindex].find('td').last().attr('rowspan',rows.length);
							}
							else
							{
								rows[rowindex].find('td').first().remove();
								rows[rowindex].find('td').last().remove();
							}
							/* append */
							vars.rows.append(rows[rowindex].addClass((rowcounter%2==0)?'odd':'even'));
						});
						rowcounter++;
					});
					/* append elements */
					vars.grid.append($('<thead>').append(vars.header));
					vars.grid.append(vars.rows);
					vars.container.empty().append(vars.grid);
					$('body').append(vars.thumbnail);
					/* append fix containers */
					$.each(vars.grid.parents(),function(index){
						var check=$(this).attr('style');
						if (check)
							if (check.indexOf(vars.grid.width().toString()+'px')>-1) vars.containers.push($(this));
					});
					if (vars.containers.length==0) vars.containers.push(vars.container);
					/* mouse events */
					$(vars.grid).on('mousemove','td,th',function(e){
						if (vars.drag.capture) return;
						var left=e.pageX-$(this).offset().left;
						var hit=true;
						if (left<$(this).outerWidth(false)-5) hit=false;
						if (left>$(this).outerWidth(false)) hit=false;
						if (hit) $(this).addClass('adjust');
						else $(this).removeClass('adjust');
					});
					$(vars.grid).on('mousedown','td,th',function(e){
						if (!$(this).hasClass('adjust')) return;
						vars.drag.capture=true;
						vars.drag.keep.column=$(this).outerWidth(false);
						vars.drag.keep.container=vars.containers[0].outerWidth(false);
						vars.drag.keep.position=e.pageX;
						/* setup resize column */
						vars.drag.cells=[];
						$.each($('td,th',vars.grid),function(index){
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
				});
			},function(error){});
		},function(error){});
	});
})(jQuery,kintone.$PLUGIN_ID);
