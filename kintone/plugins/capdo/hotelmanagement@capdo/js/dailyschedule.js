/*
*--------------------------------------------------------------------
* jQuery-Plugin "dailyschedule"
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
		limit:500,
		offset:0,
		fromdate:new Date(),
		todate:new Date(),
		datecalc:null,
		fromcalendar:null,
		tocalendar:null,
		table:null,
		records:[],
		rooms:[],
		config:{},
		fieldinfos:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var functions={
		/* rebuild view */
		build:function(filter,heads){
			/* insert row */
			vars.table.insertrow(null,function(row){
				var baserow=row;
				baserow.find('td').first().append($('<p>').addClass('customview-p').html(heads[vars.config['roomname']].value));
				if (filter.length!=0)
				{
					for (var i=0;i<filter.length;i++)
					{
						/* create cell */
						var datecalc=$.hotelmanagementdatecalc(
							new Date(filter[i][vars.config['fromtime']].value.dateformat()),
							new Date(filter[i][vars.config['totime']].value.dateformat()),
							new Date((vars.fromdate.format('Y-m-d')+'T00:00:00+0900').dateformat())
						);
						if (datecalc.to.hour<0) continue;
						var from=(datecalc.from.hour*parseInt(vars.config['scale']))+Math.floor(datecalc.from.minute/(60/parseInt(vars.config['scale'])));
						var to=(datecalc.to.hour*parseInt(vars.config['scale']))+Math.ceil(datecalc.to.minute/(60/parseInt(vars.config['scale'])))-1;
						var fromindex=0;
						var toindex=0;
						if (from<0) from=0;
						if (to>((vars.datecalc.diffhours+1)*parseInt(vars.config['scale']))-1) to=((vars.datecalc.diffhours+1)*parseInt(vars.config['scale']))-1;
						from++;
						to++;
						if (from>to) continue;
						/* check cell merged */
						var isinsertrow=true;
						var mergerow=baserow;
						for (var i2=vars.table.contents.find('tr').index(baserow);i2<vars.table.contents.find('tr').length;i2++)
						{
							mergerow=vars.table.contents.find('tr').eq(i2);
							fromindex=vars.table.mergecellindex(mergerow,from);
							toindex=vars.table.mergecellindex(mergerow,to);
							if (!mergerow.find('td').eq(fromindex).hasClass('dailyschedule-merge') && !mergerow.find('td').eq(toindex).hasClass('dailyschedule-merge')) {isinsertrow=false;break;}
						}
						/* merge cell */
						if (isinsertrow)
						{
							vars.table.insertrow(null,function(row){
								fromindex=vars.table.mergecellindex(row,from);
								toindex=vars.table.mergecellindex(row,to);
								functions.mergeaftervalue(row,fromindex,toindex,filter[i]);
								/* check row heads */
								row.find('td').eq(0).html(baserow.find('td').eq(0).html());
							});
						}
						else functions.mergeaftervalue(mergerow,fromindex,toindex,filter[i]);
					}
				}
			});
		},
		/* setup merge cell value */
		mergeaftervalue:function(row,from,to,filter){
			var cell=row.find('td').eq(from);
			vars.table.mergecell(
				cell,
				from,
				to
			);
			/* cell value switching */
			cell.append($('<p>').html($.fieldvalue(filter[vars.config['visitor']])));
			$.each(filter,function(key,values){
				if (values!=null)
					if (values.value!=null)
						cell.append($('<input type="hidden">').attr('id',key).val(values.value));
			})
			/* mouse events */
			cell.on('click',function(){
				window.open(kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/show#record='+cell.find('input#\\$id').val()+'&mode=show');
			});
		},
		/* reload view */
		load:function(){
			vars.records=[];
			vars.offset=0;
			functions.loaddatas(function(){
				/* create table */
				var container=$('div#hotelmanagement-container').empty();
				var head=$('<tr></tr><tr></tr><tr></tr>');
				var template=$('<tr>');
				var spacer=$('<span>');
				var colspan={date:new Date(vars.fromdate.format('Y-m-d').dateformat()),hour:0,index:1,span:0};
				vars.datecalc=$.hotelmanagementdatecalc(new Date((vars.fromdate.format('Y-m-d')+'T00:00:00+0900').dateformat()),new Date((vars.todate.format('Y-m-d')+'T23:59:59+0900').dateformat()));
				head.eq(0).append($('<th class="dailyschedule-cellhead">').append($('<p>').addClass('customview-p').html('&nbsp;')));
				head.eq(1).append($('<th class="dailyschedule-cellhead">').append($('<p>').addClass('customview-p').html('&nbsp;')));
				head.eq(2).append($('<th class="dailyschedule-cellhead">').append($('<p>').addClass('customview-p').html('&nbsp;')));
				template.append($('<td class="dailyschedule-cellhead">'));
				if (vars.config['scalefixed']=='1') spacer.css({'display':'block','height':'1px','width':vars.config['scalefixedwidth']+'px'});
				for (var i=0;i<vars.datecalc.diffhours;i++)
				{
					colspan.hour=i%24;
					if (i!=0 && colspan.hour==0)
					{
						head.eq(0).find('th').eq(colspan.index).attr('colspan',colspan.span);
						for (var i2=colspan.index+1;i2<i+1;i2++) head.eq(0).find('th').eq(i2).hide();
						colspan.date=colspan.date.calc('1 day');
						colspan.index=i+1;
						colspan.span=0;
					}
					colspan.span+=parseInt(vars.config['scale']);
					head.eq(0).append($('<th colspan="'+vars.config['scale']+'">').css({'padding':'0px 0.5em'}).text(colspan.date.format('m-d')));
					head.eq(1).append($('<th colspan="'+vars.config['scale']+'">').text(colspan.hour));
					for (var i2=0;i2<parseInt(vars.config['scale']);i2++)
					{
						if (vars.config['scalefixed']=='1') head.eq(2).append($('<th>').append(spacer.clone(false)));
						else head.eq(2).append($('<th>'));
						template.append($('<td>'));
					}
				}
				head.eq(0).find('th').eq(colspan.index).attr('colspan',colspan.span);
				for (var i=colspan.index+1;i<head.eq(0).find('th').length;i++) head.eq(0).find('th').eq(i).hide();
				vars.table=$('<table id="dailyschedule" class="customview-table dailyschedule '+((vars.config['scalefixed']=='1')?'cellfixed':'')+'">').mergetable({
					container:container,
					head:head,
					template:template,
					merge:false,
					mergeclass:'dailyschedule-merge'
				});
				/* place the data */
				vars.table.clearrows();
				for (var i=0;i<vars.rooms.length;i++)
				{
					var room=vars.rooms[i];
					/* rebuild view */
					functions.build($.grep(vars.records,function(item,index){
						var fieldinfo=vars.fieldinfos[vars.config['room']];
						for (var i2=0;i2<item[fieldinfo.tablecode].value.length;i2++)
							if (item[fieldinfo.tablecode].value[i2].value[vars.config['room']].value==room[fieldinfo.lookup.relatedKeyField].value) return true;
						return false;
					}),vars.rooms[i]);
				}
				/* merge row */
				var rowspan={cache:'',index:-1,span:0};
				$.each(vars.table.contents.find('tr'),function(index){
					var row=vars.table.contents.find('tr').eq(index);
					var cell=row.find('td').first();
					if (rowspan.cache!=cell.find('p').text())
					{
						if (rowspan.index!=-1)
						{
							vars.table.contents.find('tr').eq(rowspan.index).find('td').first().attr('rowspan',rowspan.span);
							for (var i=rowspan.index+1;i<index;i++) vars.table.contents.find('tr').eq(i).find('td').first().hide();
						}
						rowspan.cache=cell.find('p').text();
						rowspan.index=index;
						rowspan.span=0;
					}
					rowspan.span++;
				});
				var index=vars.table.contents.find('tr').length-1;
				var row=vars.table.contents.find('tr').last();
				var cell=row.find('td').first();
				if (rowspan.cache==cell.find('p').text() && rowspan.index!=index)
				{
					vars.table.contents.find('tr').eq(rowspan.index).find('td').first().attr('rowspan',rowspan.span);
					for (var i=rowspan.index+1;i<index+1;i++) vars.table.contents.find('tr').eq(i).find('td').first().hide();
				}
			});
		},
		/* reload datas */
		loaddatas:function(callback){
			var body={
				app:kintone.app.getId(),
				query:kintone.app.getQueryCondition()
			};
			body.query+=((body.query.length!=0)?' and ':'');
			body.query+='(';
			body.query+='(';
			body.query+=vars.config['fromtime']+'>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'T23:59:59+0900"';
			body.query+=' and '+vars.config['fromtime']+'<"'+vars.todate.calc('1 day').format('Y-m-d')+'T00:00:00+0900"';
			body.query+=')';
			body.query+=' or ';
			body.query+='(';
			body.query+=vars.config['totime']+'>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'T23:59:59+0900"';
			body.query+=' and '+vars.config['totime']+'<"'+vars.todate.calc('1 day').format('Y-m-d')+'T00:00:00+0900"';
			body.query+=')';
			body.query+=' or ';
			body.query+='(';
			body.query+=vars.config['fromtime']+'<"'+vars.fromdate.format('Y-m-d')+'T00:00:00+0900"';
			body.query+=' and '+vars.config['totime']+'>"'+vars.todate.format('Y-m-d')+'T23:59:59+0900"';
			body.query+=')';
			body.query+=')';
			body.query+=' order by '+vars.config['fromtime']+' asc limit '+vars.limit.toString()+' offset '+vars.offset.toString();
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(vars.records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(callback);
				else callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		},
		/* reload rooom datas */
		loadrooms:function(callback){
			var body={
				app:vars.fieldinfos[vars.config['room']].lookup.relatedApp.app,
				query:vars.fieldinfos[vars.config['room']].lookup.filterCond
			};
			body.query+=' order by '+vars.fieldinfos[vars.config['room']].lookup.sort+' limit '+vars.limit.toString()+' offset '+vars.offset.toString();
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(vars.rooms,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loadrooms(callback);
				else callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check viewid */
		if (event.viewId!=vars.config.dailyschedule) return;
		/* get query strings */
		var queries=$.queries();
		if (vars.config['fromtime'] in queries)
		{
			vars.fromdate=new Date(queries[vars.config['fromtime']].dateformat());
			vars.todate=new Date(queries[vars.config['fromtime']].dateformat());
		}
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
					var container=$('div#hotelmanagement-container').css({'padding-bottom':'100px'});
					var feed=$('<div class="hotelmanagement-dayfeed">');
					var fromdate=$('<span id="date" class="customview-span">');
					var frombutton=$('<button id="datepick" class="customview-button calendar-button">');
					var fromprev=$('<button id="prev" class="customview-button prev-button">');
					var fromnext=$('<button id="next" class="customview-button next-button">');
					var todate=$('<span id="date" class="customview-span">');
					var tobutton=$('<button id="datepick" class="customview-button calendar-button">');
					var toprev=$('<button id="prev" class="customview-button prev-button">');
					var tonext=$('<button id="next" class="customview-button next-button">');
					/* append elements */
					feed.append(fromprev);
					feed.append(fromdate);
					feed.append(frombutton);
					feed.append(fromnext);
					feed.append($('<span class="customview-span">').text(' ~ '));
					feed.append(toprev);
					feed.append(todate);
					feed.append(tobutton);
					feed.append(tonext);
					if ($('.hotelmanagement-dayfeed').size()) $('.hotelmanagement-dayfeed').remove();
					kintone.app.getHeaderMenuSpaceElement().appendChild(feed[0]);
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
					fromdate.text(vars.fromdate.format('Y-m-d'));
					todate.text(vars.todate.format('Y-m-d'));
					/* day pickup button */
					vars.fromcalendar=$('body').calendar({
						selected:function(target,value){
							vars.fromdate=new Date(value.dateformat());
							fromdate.text(value);
							/* reload view */
							functions.load();
						}
					});
					frombutton.on('click',function(){vars.fromcalendar.show({activedate:vars.fromdate});});
					vars.tocalendar=$('body').calendar({
						selected:function(target,value){
							vars.todate=new Date(value.dateformat());
							todate.text(value);
							/* reload view */
							functions.load();
						}
					});
					tobutton.on('click',function(){vars.tocalendar.show({activedate:vars.todate});});
					/* day feed button */
					$.each([fromprev,fromnext],function(){
						$(this).on('click',function(){
							var days=($(this).attr('id')=='next')?1:-1;
							vars.fromdate=vars.fromdate.calc(days+' day');
							fromdate.text(vars.fromdate.format('Y-m-d'));
							/* reload view */
							functions.load();
						});
					});
					$.each([toprev,tonext],function(){
						$(this).on('click',function(){
							var days=($(this).attr('id')=='next')?1:-1;
							vars.todate=vars.todate.calc(days+' day');
							todate.text(vars.todate.format('Y-m-d'));
							/* reload view */
							functions.load();
						});
					});
					/* get fields of app */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
						vars.fieldinfos=$.fieldparallelize(resp.properties);
						functions.loadrooms(function(){
							/* reload view */
							functions.load();
						});
					},function(error){});
				}
				else swal('Error!','ライセンス認証に失敗しました。','error');
			},
			function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
		);
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
