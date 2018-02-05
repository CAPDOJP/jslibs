/*
*--------------------------------------------------------------------
* jQuery-Plugin "attendance"
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
		fromdate:new Date(),
		todate:new Date(),
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
					var row=vars.template.clone(true);
					var add=true;
					var night=0;
					var nightover=0;
					var over=0;
					var tardy=0;
					var work=0;
					var attendances=[];
					var absences=[];
					for (var i2=0;i2<filter.length;i2++)
					{
						var shiftfrom=$.fieldvalue(filter[i2][vars.config['shiftfromtime']]).dateformat();
						var shiftto=$.fieldvalue(filter[i2][vars.config['shifttotime']]).dateformat();
						var workfrom=$.fieldvalue(filter[i2][vars.config['workfromtime']]).dateformat();
						var workto=$.fieldvalue(filter[i2][vars.config['worktotime']]).dateformat();
						var date=new Date(shiftfrom).format('Y-m-d');
						var datecalc={};
						add=true;
						if (workto.length==0) workto=shiftto;
						if (!(date in attendances))
						{
							if (workfrom.length!=0)
							{
								attendances.push(date);
								if (date in absences) absences.splice(absences.indexOf(date),1);
							}
							else
							{
								absences.push(date);
								add=false;
							}
						}
						else
						{
							if (workfrom.length==0) add=false;
						}
						if (!add) continue;
						console.log(workfrom);
						console.log(workto);
						console.log(shiftfrom);
						console.log(shiftto);
						/* calculate worktime */
						datecalc=$.datecalc(new Date(workfrom),new Date(workto));
						work+=datecalc.diffhours+(datecalc.diffminutes/60);
						/* calculate come in late time */
						datecalc=$.datecalc(new Date(shiftfrom),new Date(workfrom));
						if ((datecalc.diffhours+datecalc.diffminutes)>0) tardy+=datecalc.diffhours+(datecalc.diffminutes/60);
						/* calculate leave early time */
						datecalc=$.datecalc(new Date(workto),new Date(shiftto));
						if ((datecalc.diffhours+datecalc.diffminutes)>0) tardy+=datecalc.diffhours+(datecalc.diffminutes/60);
						/* calculate over time */
						datecalc=$.datecalc(new Date(shiftto),new Date(workto));
						if ((datecalc.diffhours+datecalc.diffminutes)>0) over+=datecalc.diffhours+(datecalc.diffminutes/60);
						/* calculate night time */
						if (new Date(workto)>new Date(date).calc('1 day').setHours(5)) workto=date+' 05:00:00';
						datecalc=$.datecalc(new Date(date).setHours(22),new Date(workto));
						if ((datecalc.diffhours+datecalc.diffminutes)>0) night+=datecalc.diffhours+(datecalc.diffminutes/60);
						/* calculate night over time */
						if (new Date(shiftto)<new Date(date).setHours(22)) shiftto=date+' 22:00:00';
						datecalc=$.datecalc(new Date(shiftto),new Date(workto));
						if ((datecalc.diffhours+datecalc.diffminutes)>0)
						{
							nightover+=datecalc.diffhours+(datecalc.diffminutes/60);
							night-=nightover;
							over-=nightover;
						}
					}
					work=Math.ceil(work*100)/100;
					tardy=Math.ceil(tardy*100)/100;
					night=Math.ceil(night*100)/100;
					over=Math.ceil(over*100)/100;
					nightover=Math.ceil(nightover*100)/100;
					$('td',row).eq(0).text(employee.display);
					$('td',row).eq(1).text(attendances.length.comma()+'日');
					$('td',row).eq(2).text(absences.length.comma()+'日');
					$('td',row).eq(3).text(work.comma()+'H');
					$('td',row).eq(4).text(tardy.comma()+'H');
					$('td',row).eq(5).text(night.comma()+'H');
					$('td',row).eq(6).text(over.comma()+'H');
					$('td',row).eq(7).text(nightover.comma()+'H');
					vars.rows.append(row);
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
			query+=vars.config['shiftfromtime']+'>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'T23:59:59+0900"';
			query+=' and '+vars.config['shiftfromtime']+'<"'+vars.todate.calc('1 day').format('Y-m-d')+'T00:00:00+0900"';
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
		if (event.viewId!=vars.config.attendance) return;
		/* initialize valiable */
		var feed=$('<div class="workshift-headermenucontents">');
		var month=$('<span id="month" class="customview-span">');
		var prev=$('<button id="prev" class="customview-button prev-button">');
		var next=$('<button id="next" class="customview-button next-button">');
		/* append elements */
		feed.append(prev);
		feed.append(month);
		feed.append(next);
		if ($('.workshift-headermenucontents').size()) $('.workshift-headermenucontents').remove();
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed[0]);
		/* setup date value */
		vars.fromdate=vars.fromdate.calc('first-of-month');
		vars.todate=vars.fromdate.calc('1 month').calc('-1 day');
		month.text(vars.fromdate.format('Y-m'));
		/* day feed button */
		$.each([prev,next],function(){
			$(this).on('click',function(){
				var months=($(this).attr('id')=='next')?1:-1;
				vars.fromdate=vars.fromdate.calc(months+' month');
				vars.todate=vars.fromdate.calc('1 month').calc('-1 day');
				month.text(vars.fromdate.format('Y-m'));
				/* reload view */
				functions.load();
			});
		});
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=resp.properties;
			/* get datas of employee */
			$.loademployees(vars.config,vars.fieldinfos,vars.apps,vars.offset,function(){
				/* create table */
				vars.container=$('div#workshift-container');
				vars.table=$('<table id="attendance" class="customview-table attendance">');
				vars.header=$('<tr>');
				vars.rows=$('<tbody>');
				vars.template=$('<tr>');
				vars.header.append($('<th>').text('氏名'));
				vars.header.append($('<th>').text('出勤'));
				vars.header.append($('<th>').text('欠勤'));
				vars.header.append($('<th>').text('実働'));
				vars.header.append($('<th>').text('遅刻・早退'));
				vars.header.append($('<th>').text('深夜勤務'));
				vars.header.append($('<th>').text('普通残業'));
				vars.header.append($('<th>').text('深夜残業'));
				vars.template.append($('<td>'));
				vars.template.append($('<td>'));
				vars.template.append($('<td>'));
				vars.template.append($('<td>'));
				vars.template.append($('<td>'));
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
