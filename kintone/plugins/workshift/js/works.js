/*
*--------------------------------------------------------------------
* jQuery-Plugin "works"
* Version: 3.0
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
		date:new Date(),
		calendar:null,
		container:null,
		table:null,
		header:null,
		rows:null,
		template:null,
		apps:{},
		config:{},
		offset:{},
		fieldinfos:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var limit=500;
	var functions={
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			vars.apps[kintone.app.getId()]=null;
			vars.offset[kintone.app.getId()]=0;
			functions.loaddatas(kintone.app.getId(),function(){
				var records=vars.apps[kintone.app.getId()];
				/* place the employee data */
				vars.rows.empty();
				for (var i=0;i<vars.apps['employee'].length;i++)
				{
					var employee=vars.apps['employee'][i];
					if (vars.config['assignment'].length!=0)
						if ($.inArray($('select.assignment').val(),employee.assignment)<0) continue;
					/* rebuild view */
					var filter=$.grep(records,function(item,index){
						var exists=false;
						var fieldinfo=vars.fieldinfos[vars.config['employee']];
						switch (fieldinfo.type)
						{
							case 'USER_SELECT':
								for (var i2=0;i2<item[vars.config['employee']].value.length;i2++)
									if (item[vars.config['employee']].value[i2].code==employee.field) exists=true;
								break;
							default:
								if (item[vars.config['employee']].value==employee.field) exists=true;
								break;
						}
						return exists;
					});
					for (var i2=0;i2<filter.length;i2++)
					{
						var row=vars.template.clone(true);
						var shiftfrom=new Date($.fieldvalue(filter[i2][vars.config['shiftfromtime']]).dateformat());
						var shiftto=new Date($.fieldvalue(filter[i2][vars.config['shifttotime']]).dateformat());
						var workfrom=$.fieldvalue(filter[i2][vars.config['workfromtime']]).dateformat();
						var workto=$.fieldvalue(filter[i2][vars.config['worktotime']]).dateformat();
						$('.workid',row).val(filter[i2]['$id'].value);
						$('td',row).eq(2).text(employee.display);
						$('td',row).eq(3).text(shiftfrom.format('H:i')+' - '+shiftto.format('H:i'));
						if (workfrom.length==0)
						{
							$('.workstatus',row).val('start');
							$('.workpunch',row).addClass('start').text('勤務開始');
							$('td',row).eq(4).text('勤務開始待ち');
						}
						else
						{
							if (workto.length==0)
							{
								$('.workstatus',row).val('end');
								$('.workpunch',row).addClass('end').text('勤務終了');
								$('td',row).eq(4).text('勤務中');
							}
							else
							{
								$('.workstatus',row).val('');
								$('.workpunch',row).hide();
								$('td',row).eq(4).text('勤務終了');
							}
						}
						vars.rows.append(row);
					}
				}
			});
		},
		/* reload datas */
		loaddatas:function(appkey,callback){
			var sort='';
			var query=kintone.app.getQueryCondition();
			var body={
				app:appkey,
				query:''
			};
			query+=((query.length!=0)?' and ':'');
			query+=vars.config['shiftfromtime']+'>"'+vars.date.calc('-1 day').format('Y-m-d')+'T23:59:59+0900"';
			query+=' and '+vars.config['shiftfromtime']+'<"'+vars.date.calc('1 day').format('Y-m-d')+'T00:00:00+0900"';
			sort=' order by '+vars.config['shiftfromtime']+' asc limit '+limit.toString()+' offset '+vars.offset[appkey].toString();
			body.query+=query+sort;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[appkey]==null) vars.apps[appkey]=resp.records;
				else Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=limit;
				if (resp.records.length==limit) functions.loaddatas(appkey,callback);
				else callback();
			},function(error){});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check viewid */
		if (event.viewId!=vars.config.works) return;
		/* initialize valiable */
		var feed=$('<div class="workshift-headermenucontents">');
		var date=$('<span id="date" class="customview-span datedisplay">');
		var button=$('<button id="datepick" class="customview-button calendar-button">');
		var prev=$('<button id="prev" class="customview-button prev-button">');
		var next=$('<button id="next" class="customview-button next-button">');
		var assignment=$('<div class="kintoneplugin-select-outer">').append($('<div class="kintoneplugin-select">').append($('<select class="assignment">')));
		var week=['日','月','火','水','木','金','土'];
		/* append elements */
		feed.append(assignment);
		feed.append(prev);
		feed.append(date);
		feed.append(button);
		feed.append(next);
		if ($('.workshift-headermenucontents').size()) $('.workshift-headermenucontents').remove();
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed[0]);
		/* setup date value */
		date.text(vars.date.format('Y-m-d')+' ('+week[vars.date.getDay()]+')');
		/* day pickup button */
		vars.calendar=$('body').calendar({
			selected:function(target,value){
				vars.date=new Date(value.dateformat());
				date.text(value+' ('+week[vars.date.getDay()]+')');
				/* reload view */
				functions.load();
			}
		});
		button.on('click',function(){
			vars.calendar.show({activedate:vars.date});
		});
		/* day feed button */
		$.each([prev,next],function(){
			$(this).on('click',function(){
				var days=($(this).attr('id')=='next')?1:-1;
				vars.date=vars.date.calc(days+' day');
				date.text(vars.date.format('Y-m-d')+' ('+week[vars.date.getDay()]+')');
				/* reload view */
				functions.load();
			});
		});
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=resp.properties;
			/* get datas of employee */
			$.loademployees(vars.config,vars.fieldinfos,vars.apps,vars.offset,function(){
				if (vars.config['assignment'].length!=0)
				{
					/* sort assignment */
					vars.apps['assignment']=(function(base){
						var sorted={};
						var keys=Object.keys(base);
						keys.sort();
						if (vars.config['assignmentsort']=='asc') for (var i=0;i<keys.length;i++) sorted[keys[i]]=base[keys[i]];
						else for (var i=keys.length-1;i>-1;i--) sorted[keys[i]]=base[keys[i]];
						return sorted;
					})(vars.apps['assignment']);
					/* setup assignment */
					$.each(vars.apps['assignment'],function(key,values){
						$('select',assignment).append($('<option>').attr('value',key).html('&nbsp;'+values+'&nbsp;'));
					});
					$('select',assignment).on('change',function(){
						/* reload view */
						functions.load();
					});
				}
				else assignment.hide();
				/* create table */
				vars.container=$('div#workshift-container');
				vars.table=$('<table id="works" class="customview-table works">');
				vars.header=$('<tr>');
				vars.rows=$('<tbody>');
				vars.template=$('<tr>');
				vars.header.append($('<th>'));
				vars.header.append($('<th>'));
				vars.header.append($('<th>').text('氏名'));
				vars.header.append($('<th>').text('勤務予定時間'));
				vars.header.append($('<th>').text('勤務状況'));
				vars.template.append(
					$('<td>')
					.append(
						$('<button class="customview-button edit-button">').on('click',function(){
							var cell=$(this).closest('td');
							var index=$('.workid',cell).val();
							if (index.length!=0) window.location.href=kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/show#record='+index;
						})
					)
					.append($('<input type="hidden" class="workid" value="">'))
				);
				vars.template.append(
					$('<td>')
					.append(
						$('<button class="workpunch">').on('click',function(){
							var row=$(this).closest('tr');
							var index=$('.workid',row).val();
							var registtime=new Date();
							switch ($('.workstatus',row).val())
							{
								case 'start':
									swal({
										title:'確認',
										text:$('td',row).eq(2).text()+'さんの勤務開始処理をします。\n宜しいですか?',
										type:'warning',
										showCancelButton:true,
										confirmButtonText:'OK',
										cancelButtonText:"Cancel"
									},
									function(){
										var body={
											app:kintone.app.getId(),
											id:index,
											record:{}
										};
										body.record[vars.config['workfromtime']]={value:registtime.format('Y-m-d')+'T'+registtime.format('H:i')+':00+0900'};
										kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
											$('.workstatus',row).val('end');
											$('.workpunch',row).removeClass('start').addClass('end').text('勤務終了');
											$('td',row).eq(4).text('勤務中');
										},function(error){
											swal('Error!',error.message,'error');
										});
									});
									break;
								case 'end':
									swal({
										title:'確認',
										text:$('td',row).eq(2).text()+'さんの勤務終了処理をします。\n宜しいですか?',
										type:'warning',
										showCancelButton:true,
										confirmButtonText:'OK',
										cancelButtonText:"Cancel"
									},
									function(){
										var body={
											app:kintone.app.getId(),
											id:index,
											record:{}
										};
										body.record[vars.config['worktotime']]={value:registtime.format('Y-m-d')+'T'+registtime.format('H:i')+':00+0900'};
										kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
											$('.workstatus',row).val('');
											$('.workpunch',row).hide();
											$('td',row).eq(4).text('勤務終了');
										},function(error){
											swal('Error!',error.message,'error');
										});
									});
									break;
							}
						})
					)
					.append($('<input type="hidden" class="workstatus" value="">'))
				);
				vars.template.append($('<td>'));
				vars.template.append($('<td>'));
				vars.template.append($('<td>'));
				/* append elements */
				vars.table.append($('<thead>').append(vars.header));
				vars.table.append(vars.rows);
				vars.container.empty().append(vars.table);
				/* reload view */
				functions.load();
			});
		},function(error){});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
