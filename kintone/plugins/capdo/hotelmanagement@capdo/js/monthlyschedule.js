/*
*--------------------------------------------------------------------
* jQuery-Plugin "monthlyschedule"
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
		build:function(records,cell){
			/* append cell */
			for (var i=0;i<records.length;i++)
			{
				var record=records[i];
				var fieldinfo=vars.fieldinfos[vars.config['room']];
				for (var i2=0;i2<record[fieldinfo.tablecode].value.length;i2++)
				{
					cell.append(
						$('<div class="monthlyschedule-cell">')
						.append($('<span>').html((function(record){
							var filter=$.grep(vars.rooms,function(item,index){
								return item[fieldinfo.lookup.relatedKeyField].value==record[fieldinfo.tablecode].value[i2].value[vars.config['room']].value;
							});
							return (filter.length!=0)?filter[0][fieldinfo.lookup.relatedKeyField].value:'';
						})(records[i])))
						.append($('<span>').html(records[i][vars.config['visitor']].value))
						.on('click',function(){
							window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+$(this).find('input#id').val()+'&mode=show';
						})
						.append($('<input type="hidden">').attr('id','id').val(records[i]['$id'].value))
					);
				}
			}
		},
		/* reload view */
		load:function(){
			vars.records=[];
			vars.offset=0;
			functions.loaddatas(function(){
				/* initialize rows */
				vars.table.contents.find('tr').show();
				/* initialize cells */
				vars.table.contents.find('td').each(function(index){
					var day=vars.fromdate.calc((index-vars.fromdate.getDay()).toString()+' day');
					var cell=$(this);
					/* not processing beyond the next month 1 day */
					if (day.format('Y-m')!=vars.fromdate.format('Y-m')) {cell.empty();return;}
					cell.empty();
					cell.append($('<div class="monthlyschedule-days">')
						.append($('<span>').text(day.getDate()))
						.append($('<button class="customview-button time-button">').text('稼働状況一覧を表示').on('click',function(){
							var query='';
							query+='view='+vars.config.dailyschedule;
							query+='&'+vars.config['fromtime']+'='+day.format('Y-m-d');
							window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/?'+query;
						}))
						.append($('<button class="customview-button time-button">').text('食事提供一覧を表示').on('click',function(){
							var query='';
							query+='view='+vars.config.catering;
							query+='&date='+day.format('Y-m-d');
							window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/?'+query;
						}))
					);
					switch ((index+1)%7)
					{
						case 0:
							//saturday's style
							cell.find('span').css({'color':'#69B4C8'});
							break;
						case 1:
							//sunday's style
							cell.find('span').css({'color':'#FA8273'});
							break;
					}
					/* place the data */
					var filter=$.grep(vars.records,function(item,index){
						var exists=0;
						var fromtime=new Date(item[vars.config['fromtime']].value.dateformat());
						var totime=new Date(item[vars.config['totime']].value.dateformat());
						var starttime=new Date(day.calc('-1 day').format('Y-m-d')+'T23:59:59+0900');
						var endtime=new Date(day.calc('1 day').format('Y-m-d')+'T00:00:00+0900');
						if (fromtime>starttime && fromtime<endtime) exists++;
						if (totime>starttime && totime<endtime) exists++;
						if (fromtime<new Date(day.format('Y-m-d')+'T00:00:00+0900') && totime>new Date(day.format('Y-m-d')+'T23:59:59+0900')) exists++;
						return exists==1;
					});
					/* rebuild view */
					functions.build(filter,cell);
				});
				/* check no element rows */
				$.each(vars.table.contents.find('tr'),function(index,values){
					if (!$(this).find('div').size()) $(this).hide();
				})
			});
		},
		/* reload datas */
		loaddatas:function(callback){
			var body={
				app:kintone.app.getId(),
				query:kintone.app.getQueryCondition()
			};
			body.query+=vars.config['fromtime']+'>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'T23:59:59+0900"';
			body.query+=' and '+vars.config['fromtime']+'<"'+vars.todate.calc('1 day').format('Y-m-d')+'T00:00:00+0900"';
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
		if (event.viewId!=vars.config.monthlyschedule) return;
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
					var month=$('<span id="month" class="customview-span">');
					var prev=$('<button id="prev" class="customview-button prev-button">');
					var next=$('<button id="next" class="customview-button next-button">');
					/* append elements */
					feed.append(prev);
					feed.append(month);
					feed.append(next);
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
					vars.fromdate=vars.fromdate.calc('first-of-month');
					vars.todate=vars.fromdate.calc('1 month').calc('-1 day');
					month.text(vars.fromdate.format('Y-m-d')+' ～ '+vars.todate.format('Y-m-d'));
					/* day feed button */
					$.each([prev,next],function(){
						$(this).on('click',function(){
							var months=($(this).attr('id')=='next')?1:-1;
							vars.fromdate=vars.fromdate.calc(months+' month');
							vars.todate=vars.fromdate.calc('1 month').calc('-1 day');
							month.text(vars.fromdate.format('Y-m-d')+' ～ '+vars.todate.format('Y-m-d'));
							/* reload view */
							functions.load();
						});
					});
					/* create table */
					container.empty();
					var head=$('<tr>');
					var template=$('<tr>');
					var week=['日','月','火','水','木','金','土'];
					for (var i=0;i<7;i++)
					{
						head.append($('<th>').text(week[i]));
						template.append($('<td>'));
					}
					vars.table=$('<table id="monthlyschedule" class="customview-table monthlyschedule">').mergetable({
						container:container,
						head:head,
						template:template
					});
					/* insert row */
					for (var i=0;i<8;i++) vars.table.insertrow();
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
