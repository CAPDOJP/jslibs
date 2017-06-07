/*
*--------------------------------------------------------------------
* jQuery-Plugin "listviewer"
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
		grid:null,
		header:null,
		rows:null,
		template:null,
		columns:{},
		config:{},
		fieldcodes:{}
	};
	var events={
		show:[
			'app.record.index.show'
		]
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check viewid */
		var excludeviews=vars.config.excludeviews.split(',');
		if (excludeviews.length!=0)
			if ($.inArray(event.viewId.toString(),excludeviews)>-1) return;
		/* initialize valiable */
		vars.container=$('div#view-list-data-gaia');
		vars.grid=$('<table id="listviewer" class="customview-table">');
		vars.header=$('<tr>');
		vars.rows=$('<tbody>');
		vars.template=$('<tr>');
		/* create grid */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			var fieldinfo=resp.properties;
			kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
				$.each(resp.views,function(key,values){
				    if (values.type.toUpperCase()=='LIST' && values.id==event.viewId)
				    {
						/* append button column */
						vars.header.append($('<th>').text(''));
						vars.template.append($('<td class="buttoncell">')
							.append($('<button class="customview-button edit-button">').on('click',function(){
								var row=$(this).closest('tr');
								var index=row.find('td').first().find('input').val();
								if (index.length!=0) window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+index;
							}))
							.append($('<input type="hidden" value="">'))
						);
						/* append columns */
						$.each(values.fields,function(index){addcolumns(fieldinfo[values.fields[index]],false);});
						/* append button column */
						vars.header.append($('<th>').text(''));
						vars.template.append($('<td class="buttoncell">')
							.append($('<button class="customview-button close-button">').on('click',function(){
								var row=$(this).closest('tr');
								var index=row.find('td').first().find('input').val();
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
											row.remove();
										},function(error){});
									});
								}
							}))
						);
						/* create row */
						var rowcounter=0;
						$.each(event.records,function(index,values){
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
										$.each(values.value,function(index,values){
											if (rowindex>rows.length-1)
											{
												/* append row */
												rows.push(vars.template.clone(true));
												rows[rowindex].find('td').first().find('button').hide();
												rows[rowindex].find('td').last().find('button').hide();
											}
											$.each(values.value,function(key,values){
												if (keys.indexOf(key)>-1) setvalue(rows[rowindex].find('td').eq(keys.indexOf(key)+1),vars.fieldcodes[key].fieldinfo,values.value);
											});
											rowindex++;
										});
										break;
									default:
										if (keys.indexOf(key)>-1) setvalue(rows[rowindex].find('td').eq(keys.indexOf(key)+1),vars.fieldcodes[key].fieldinfo,values.value);
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
				    }
				})
			});
		},function(error){});
	});
	/*---------------------------------------------------------------
	 add columns
	---------------------------------------------------------------*/
	function addcolumns(fieldinfo,istable){
		switch (fieldinfo.type)
		{
			case 'SUBTABLE':
				$.each(fieldinfo.fields,function(key,values){addcolumns(values,true);});
				break;
			default:
				vars.header.append($('<th>').text(fieldinfo.label));
				vars.template.append($('<td>'));
				vars.fieldcodes[fieldinfo.code]={
					isTable:istable,
					fieldinfo:fieldinfo
				};
				break;
		}
	};
	/*---------------------------------------------------------------
	 setup value
	---------------------------------------------------------------*/
	function setvalue(cell,fieldinfo,values){
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
								value=new Date(values);
								value=value.format('Y-m-d H:i');
								break;
							case 'DATE':
								value=new Date(values+'T00:00:00+09:00');
								value=value.format('Y-m-d');
								break;
							case 'TIME':
								value=new Date('1900-01-01T'+values+':00+09:00');
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
					if (values.code.length!=0) cell.html('<a href="https://'+$(location).attr('host')+'/#/people/user/'+values.code+'" target="_blank">'+values.name+'</a>');
					break;
				case 'CREATED_TIME':
				case 'DATETIME':
				case 'UPDATED_TIME':
					if (values.length!=0)
					{
						value=new Date(values);
						cell.text(value.format('Y-m-d H:i'));
					}
					break;
				case 'DATE':
					if (values.length!=0)
					{
						value=new Date(values+'T00:00:00+09:00');
						cell.text(value.format('Y-m-d'));
					}
					break;
				case 'FILE':
					if (values.length!=0)
					{
					}
					break;
				case 'LINK':
					if (values.length!=0) cell.html('<a href="'+values+'" target="_blank">'+values+'</a>');
					break;
				case 'MULTI_LINE_TEXT':
					if (values.length!=0) cell.html(values.replace('\n','<br>'));
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
						$.each(values,function(index){
							value+='<span style="display:block">'+values[index].name+'</span>';
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
						$.each(values,function(index){
							value+='<a href="https://'+$(location).attr('host')+'/#/people/user/'+values[index].code+'" style="display:block" target="_blank">'+values[index].name+'</a>';
						});
						cell.html(value);
					}
					break;
				case 'TIME':
					if (values.length!=0)
					{
						value=new Date('1900-01-01T'+values+':00+09:00');
						cell.text(value.format('H:i'));
					}
					break;
				default:
					if (values.length!=0) cell.text(values);
					break;
			}
	};
})(jQuery,kintone.$PLUGIN_ID);
