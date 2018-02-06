/*
*--------------------------------------------------------------------
* jQuery-Plugin "ganttchart"
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
		fromdate:new Date((new Date().getFullYear().toString()+'-1-1').dateformat()),
		todate:new Date((new Date().getFullYear().toString()+'-12-31').dateformat()),
		guidefrom:$('<div class="guidefrom">'),
		guideto:$('<div class="guideto">'),
		datecalc:null,
		table:null,
		apps:{},
		config:{},
		offset:{},
		colors:{},
		fieldinfos:{},
		fields:[],
		groups:[]
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
	var limit=500;
	var functions={
		/* rebuild view */
		build:function(filter){
			var color='';
			/* insert row */
			vars.table.insertrow(null,function(row){
				var baserow=row;
				if (filter.length!=0)
				{
					for (var i=0;i<vars.groups.length;i++)
					{
						baserow.find('td').eq(i)
						.append($('<p>').addClass('customview-p').html(filter[0][vars.groups[i]].value))
						.append($('<input type="hidden" id="group">').val(filter[0][vars.groups[i]].value));
					}
					for (var i=0;i<filter.length;i++)
					{
						/* setup color */
						color=vars.colors[filter[i][vars.config['color']].value];
						/* create cell */
						var datecalc=$.ganttchartdatecalc(
							new Date(filter[i][vars.config['fromdate']].value.dateformat()),
							new Date(filter[i][vars.config['todate']].value.dateformat()),
							vars.fromdate
						);
						var from=datecalc.from.month;
						var to=datecalc.to.month;
						var fromindex=0;
						var toindex=0;
						if (from<0) from=0;
						if (to>vars.datecalc.diffmonths-1) to=vars.datecalc.diffmonths-1;
						from+=vars.groups.length;
						to+=vars.groups.length;
						/* check cell merged */
						var isinsertrow=true;
						var mergerow=baserow;
						for (var i2=vars.table.contents.find('tr').index(baserow);i2<vars.table.contents.find('tr').length;i2++)
						{
							mergerow=vars.table.contents.find('tr').eq(i2);
							fromindex=vars.table.mergecellindex(mergerow,from);
							toindex=vars.table.mergecellindex(mergerow,to);
							if (!mergerow.find('td').eq(fromindex).hasClass('ganttchart-merge') && !mergerow.find('td').eq(toindex).hasClass('ganttchart-merge')) {isinsertrow=false;break;}
						}
						/* merge cell */
						if (isinsertrow)
						{
							vars.table.insertrow(null,function(row){
								fromindex=vars.table.mergecellindex(row,from);
								toindex=vars.table.mergecellindex(row,to);
								functions.mergeaftervalue(row,fromindex,toindex,filter[i],color);
								/* check row heads */
								for (var i2=0;i2<vars.groups.length;i2++) row.find('td').eq(i2).html(baserow.find('td').eq(i2).html());
							});
						}
						else functions.mergeaftervalue(mergerow,fromindex,toindex,filter[i],color);
					}
				}
			});
		},
		/* setup merge cell value */
		mergeaftervalue:function(row,from,to,filter,color){
			vars.table.mergecell(
				row.find('td').eq(from),
				from,
				to
			);
			/* cell value switching */
			row.find('td').eq(from).append($('<p>').addClass('ganttchart-merge-p').html($.fieldvalue(filter[vars.config['display']])));
			row.find('td').eq(from).append($('<span>').addClass('ganttchart-merge-span').css({'background-color':'#'+color}));
			$.each(filter,function(key,values){
				if (values!=null)
					if (values.value!=null)
						row.find('td').eq(from).append($('<input type="hidden">').attr('id',key).val(values.value));
			})
		},
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			vars.apps[kintone.app.getId()]=null;
			vars.offset[kintone.app.getId()]=0;
			functions.loaddatas(kintone.app.getId(),function(){
				var records=vars.apps[kintone.app.getId()];
				var heads=[];
				/* create rowheads */
				$.each(records,function(index){
					var head='';
					for (var i=0;i<vars.groups.length;i++) head+=records[index][vars.groups[i]].value+',';
					head=head.replace(/,$/g,'');
					if (heads.indexOf(head)<0) heads.push(head);
				});
				/* create table */
				var container=$('div#ganttchart-container').empty();
				var head=$('<tr></tr><tr></tr>');
				var template=$('<tr>');
				var spacer=$('<span class="spacer">');
				var mergeexclude=[];
				var columns={cache:vars.fromdate,index:vars.groups.length,span:0};
				for (var i=0;i<vars.groups.length;i++)
				{
					head.eq(0).append($('<th class="ganttchart-cellhead">').text(vars.fieldinfos[vars.groups[i]].label));
					head.eq(1).append($('<th class="ganttchart-cellhead">'));
					template.append($('<td class="ganttchart-cellhead">'));
					mergeexclude.push(i);
				}
				if (vars.config['scalefixed']=='1') spacer.css({'width':vars.config['scalefixedwidth']+'px'});
				for (var i=0;i<vars.datecalc.diffmonths;i++)
				{
					if (i!=0 && columns.cache.getMonth()==0)
					{
						head.eq(0).find('th').eq(columns.index).attr('colspan',columns.span);
						for (var i2=columns.index+1;i2<i+vars.groups.length;i2++) head.eq(0).find('th').eq(i2).hide();
						columns.index=i+vars.groups.length;
						columns.span=0;
					}
					head.eq(0).append($('<th>').text(columns.cache.format('Y')));
					head.eq(1).append($('<th>').append($('<span>').text(columns.cache.getMonth()+1)).append(spacer.clone(false)));
					template.append($('<td>'));
					columns.cache=columns.cache.calc('1 month');
					columns.span++;
				}
				head.eq(0).find('th').eq(columns.index).attr('colspan',columns.span);
				for (var i=columns.index+1;i<head.eq(0).find('th').length;i++) head.eq(0).find('th').eq(i).hide();
				vars.table=$('<table id="ganttchart" class="customview-table ganttchart '+((vars.config['scalefixed']=='1')?'cellfixed':'')+'">').mergetable({
					container:container,
					head:head,
					template:template,
					dragclass:'ganttchart-drag',
					merge:true,
					mergeexclude:mergeexclude,
					mergeclass:'ganttchart-merge',
					mergetrigger:function(caller,cell,rowindex,cellfrom,cellto){
						var query='';
						var frommonth=caller.cellindex(cell.parent(),cellfrom)-vars.groups.length;
						var tomonth=caller.cellindex(cell.parent(),cellto)-vars.groups.length;
						query+='&'+vars.config['fromdate']+'='+vars.fromdate.calc(frommonth.toString()+' month').format('Y-m-d');
						query+='&'+vars.config['months']+'='+(tomonth-frommonth).toString();
						for (var i=0;i<vars.groups.length;i++) query+='&'+vars.groups[i]+'='+caller.contents.find('tr').eq(rowindex).find('td').eq(i).find('input#group').val();
						window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/edit?'+query;
					},
					unmergetrigger:function(caller,cell,rowindex,cellindex){
						window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+cell.find('input#\\$id').val()+'&mode=show';
					},
					callback:{
						guidestart:function(e,caller,table,rowindex,cellindex){
							if (rowindex==null) {vars.guidefrom.hide();return;}
							var row=table.find('tbody').find('tr').eq(rowindex);
							var month=caller.cellindex(row,cellindex)-vars.groups.length;
							vars.guidefrom.text(vars.fromdate.calc(month.toString()+' month').format('Y-m')).show().css({
							  'left':(row.find('td').eq(cellindex).offset().left-$(window).scrollLeft()).toString()+'px',
							  'top':(row.offset().top-$(window).scrollTop()-vars.guidefrom.outerHeight(true)).toString()+'px'
							});
						},
						guide:function(e,caller,table,rowindex,cellfrom,cellto){
							var row=table.find('tbody').find('tr').eq(rowindex);
							var frommonth=caller.cellindex(row,cellfrom)-vars.groups.length;
							var tomonth=caller.cellindex(row,cellto)-vars.groups.length;
							vars.guidefrom.text(vars.fromdate.calc(frommonth.toString()+' month').format('Y-m')).show().css({
							  'left':(row.find('td').eq(cellfrom).offset().left-$(window).scrollLeft()).toString()+'px',
							  'top':(row.offset().top-$(window).scrollTop()-vars.guidefrom.outerHeight(true)).toString()+'px'
							});
							vars.guideto.text(vars.fromdate.calc(tomonth.toString()+' month').format('Y-m')).show().css({
							  'left':(row.find('td').eq(cellto).offset().left-$(window).scrollLeft()+row.find('td').eq(cellto).outerWidth(true)).toString()+'px',
							  'top':(row.offset().top-$(window).scrollTop()+row.outerHeight(true)).toString()+'px'
							});
						},
						guideend:function(e){
							vars.guidefrom.hide();
							vars.guideto.hide();
						}
					}
				});
				vars.table.dragenabled=!$('input#dragenabled').prop('checked');
				/* place the group data */
				for (var i=0;i<heads.length;i++)
				{
					var head=heads[i].split(',');
					var filter=$.grep(records,function(item,index){
						var exists=0;
						for (var i2=0;i2<vars.groups.length;i2++) if (item[vars.groups[i2]].value==head[i2]) exists++;
						return exists==vars.groups.length;
					});
					/* rebuild view */
					functions.build(filter);
				}
				$.each($('.ganttchart-merge'),function(){
					$(this).css({'padding-top':$(this).find('.ganttchart-merge-p').outerHeight(true).toString()+'px'});
				});
			});
		},
		/* reload datas */
		loaddatas:function(appkey,callback){
			var sort='';
			var query=kintone.app.getQueryCondition();
			var body={
				app:appkey,
				query:'',
				fields:vars.fields
			};
			query+=((query.length!=0)?' and ':'');
			query+='(';
			query+='('+vars.config['fromdate']+'>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'" and '+vars.config['fromdate']+'<"'+vars.todate.calc('1 day').format('Y-m-d')+'")';
			query+=' or ';
			query+='('+vars.config['todate']+'>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'" and '+vars.config['todate']+'<"'+vars.todate.calc('1 day').format('Y-m-d')+'")';
			query+=' or ';
			query+='('+vars.config['fromdate']+'<"'+vars.fromdate.format('Y-m-d')+'" and '+vars.config['todate']+'>"'+vars.todate.format('Y-m-d')+'")';
			query+=')';
			sort=' order by ';
			for (var i=0;i<vars.groups.length;i++) sort+=vars.groups[i]+' asc,';
			sort+=vars.config['fromdate']+' asc limit '+limit.toString()+' offset '+vars.offset[appkey].toString();
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
		if (!event.viewName.match(/稼働表/g)) return;
		/* check view type */
		if (event.viewType.toUpperCase()!='CUSTOM') return event;
		/* initialize valiable */
		var container=$('div#ganttchart-container');
		var feed=$('<div class="ganttchart-dayfeed">');
		var fromdate=$('<span id="date" class="customview-span">');
		var fromprev=$('<button id="prev" class="customview-button prev-button">');
		var fromnext=$('<button id="next" class="customview-button next-button">');
		var todate=$('<span id="date" class="customview-span">');
		var toprev=$('<button id="prev" class="customview-button prev-button">');
		var tonext=$('<button id="next" class="customview-button next-button">');
		var dragenabled=$('<label class="customview-checkbox">')
		.append($('<input type="checkbox" id="dragenabled">')
			.on('change',function(e){
				vars.table.dragenabled=!$(this).prop('checked');
			})
		)
		.append($('<span>ドラッグ操作を無効にする</span>'));
		/* append elements */
		feed.append(fromprev);
		feed.append(fromdate);
		feed.append(fromnext);
		feed.append($('<span class="customview-span">').text(' ~ '));
		feed.append(toprev);
		feed.append(todate);
		feed.append(tonext);
		if ($('.custom-elements').size()) $('.custom-elements').remove();
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed.addClass('custom-elements')[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild(dragenabled.addClass('custom-elements')[0]);
		$('body').append(vars.guidefrom).append(vars.guideto);
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
			container.css({'margin-top':(headeractions.outerHeight(false)+headerspace.outerHeight(false))+'px','overflow-x':'visible'});
		});
		/* setup date value */
		vars.todate=vars.todate.calc((parseInt(vars.config['defaultyears'])-1).toString()+' year');
		vars.datecalc=$.ganttchartdatecalc(vars.fromdate,vars.todate);
		fromdate.text(vars.fromdate.format('Y'));
		todate.text(vars.todate.format('Y'));
		/* year feed button */
		$.each([fromprev,fromnext],function(){
			$(this).on('click',function(){
				var years=($(this).attr('id')=='next')?1:-1;
				vars.fromdate=vars.fromdate.calc(years+' year');
				vars.datecalc=$.ganttchartdatecalc(vars.fromdate,vars.todate);
				fromdate.text(vars.fromdate.format('Y'));
				/* reload view */
				functions.load();
			});
		});
		$.each([toprev,tonext],function(){
			$(this).on('click',function(){
				var years=($(this).attr('id')=='next')?1:-1;
				vars.todate=vars.todate.calc(years+' year');
				vars.datecalc=$.ganttchartdatecalc(vars.fromdate,vars.todate);
				todate.text(vars.todate.format('Y'));
				/* reload view */
				functions.load();
			});
		});
		/* setup colors value */
		vars.colors=JSON.parse(vars.config['colors']);
		/* setup groups value */
		vars.groups=vars.config['group'].split(',');
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=resp.properties;
			vars.fields=['$id'];
			$.each(resp.properties,function(key,values){
				vars.fields.push(values.code);
			});
			/* reload view */
			functions.load();
		},function(error){});
		return;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* get query strings */
		var queries=$.queries();
		if (vars.config['fromdate'] in queries) event.record[vars.config['fromdate']].value=queries[vars.config['fromdate']];
		if (vars.config['months'] in queries) event.record[vars.config['months']].value=queries[vars.config['months']];
		vars.groups=vars.config['group'].split(',');
		for (var i=0;i<vars.groups.length;i++)
			if (vars.groups[i] in queries)
			{
				event.record[vars.groups[i]].value=queries[vars.groups[i]];
				event.record[vars.groups[i]].lookup=true;
			}
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
