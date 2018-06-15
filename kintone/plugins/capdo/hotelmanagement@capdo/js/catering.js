/*
*--------------------------------------------------------------------
* jQuery-Plugin "catering"
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
		date:new Date(),
		calendar:null,
		table:null,
		records:[],
		mealplaces:[],
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
				var fieldinfo=vars.fieldinfos[vars.config['mealplace']];
				baserow.find('td').first().append($('<p>').addClass('customview-p').html(heads[vars.config['mealplacename']].value));
				if (filter.length!=0)
				{
					for (var i=0;i<filter.length;i++)
					{
						var records=$.grep(filter[i][fieldinfo.tablecode].value,function(item,index){
							var exists=0;
							if (item.value[vars.config['mealdate']].value==vars.date.format('Y-m-d')) exists++;
							if (item.value[vars.config['mealplace']].value==heads[fieldinfo.lookup.relatedKeyField].value) exists++;
							return exists==2;
						});
						for (var i2=0;i2<records.length;i2++)
						{
							/* create cell */
							var fromtime=new Date((vars.date.format('Y-m-d')+'T'+records[i2].value[vars.config['mealstarttime']].value+':00+09:00').dateformat());
							var totime=new Date((vars.date.format('Y-m-d')+'T'+records[i2].value[vars.config['mealendtime']].value+':00+09:00').dateformat());
							var from=(fromtime.getHours())*parseInt(vars.config['scale'])+Math.floor(fromtime.getMinutes()/(60/parseInt(vars.config['scale'])));
							var to=(totime.getHours())*parseInt(vars.config['scale'])+Math.ceil(totime.getMinutes()/(60/parseInt(vars.config['scale'])))-1;
							var fromindex=0;
							var toindex=0;
							if (from<parseInt(vars.config['starthour'])*parseInt(vars.config['scale'])) from=parseInt(vars.config['starthour'])*parseInt(vars.config['scale']);
							if (to<parseInt(vars.config['starthour'])*parseInt(vars.config['scale'])) continue;
							if (to>(parseInt(vars.config['endhour'])+1)*parseInt(vars.config['scale'])-1) to=(parseInt(vars.config['endhour'])+1)*parseInt(vars.config['scale'])-1;
							from++;
							to++;
							if (from>to) continue;
							/* check cell merged */
							var isinsertrow=true;
							var mergerow=baserow;
							for (var i3=vars.table.contents.find('tr').index(baserow);i3<vars.table.contents.find('tr').length;i3++)
							{
								mergerow=vars.table.contents.find('tr').eq(i3);
								fromindex=vars.table.mergecellindex(mergerow,from);
								toindex=vars.table.mergecellindex(mergerow,to);
								if (!mergerow.find('td').eq(fromindex).hasClass('catering-merge') && !mergerow.find('td').eq(toindex).hasClass('catering-merge')) {isinsertrow=false;break;}
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
				window.open('https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+cell.find('input#\\$id').val()+'&mode=show');
			});
		},
		/* reload view */
		load:function(){
			vars.records=[];
			vars.offset=0;
			functions.loaddatas(function(){
				/* place the data */
				vars.table.clearrows();
				for (var i=0;i<vars.mealplaces.length;i++)
				{
					var mealplace=vars.mealplaces[i];
					/* rebuild view */
					functions.build($.grep(vars.records,function(item,index){
						var fieldinfo=vars.fieldinfos[vars.config['mealplace']];
						for (var i2=0;i2<item[fieldinfo.tablecode].value.length;i2++)
							if (item[fieldinfo.tablecode].value[i2].value[vars.config['mealplace']].value==mealplace[fieldinfo.lookup.relatedKeyField].value) return true;
						return false;
					}),vars.mealplaces[i]);
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
			body.query+=vars.config['mealdate']+' in ("'+vars.date.format('Y-m-d')+'")';
			body.query+=' order by $id asc limit '+vars.limit.toString()+' offset '+vars.offset.toString();
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(vars.records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(callback);
				else callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		},
		/* reload mealplace datas */
		loadmealplaces:function(callback){
			var body={
				app:vars.fieldinfos[vars.config['mealplace']].lookup.relatedApp.app,
				query:vars.fieldinfos[vars.config['mealplace']].lookup.filterCond
			};
			body.query+=' order by '+vars.fieldinfos[vars.config['mealplace']].lookup.sort+' limit '+vars.limit.toString()+' offset '+vars.offset.toString();
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(vars.mealplaces,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loadmealplaces(callback);
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
		if (event.viewId!=vars.config.catering) return;
		/* get query strings */
		var queries=$.queries();
		if ('date' in queries) vars.date=new Date(queries['date'].dateformat());
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
					var date=$('<span id="date" class="customview-span">');
					var button=$('<button id="datepick" class="customview-button calendar-button">');
					var prev=$('<button id="prev" class="customview-button prev-button">');
					var next=$('<button id="next" class="customview-button next-button">');
					/* append elements */
					feed.append(prev);
					feed.append(date);
					feed.append(button);
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
					date.text(vars.date.format('Y-m-d'));
					/* day pickup button */
					vars.calendar=$('body').calendar({
						selected:function(target,value){
							vars.date=new Date(value.dateformat());
							date.text(value);
							/* reload view */
							functions.load();
						}
					});
					button.on('click',function(){vars.calendar.show({activedate:vars.date});});
					/* day feed button */
					$.each([prev,next],function(){
						$(this).on('click',function(){
							var days=($(this).attr('id')=='next')?1:-1;
							vars.date=vars.date.calc(days+' day');
							date.text(vars.date.format('Y-m-d'));
							/* reload view */
							functions.load();
						});
					});
					/* create table */
					var head=$('<tr></tr><tr></tr>');
					var template=$('<tr>');
					head.eq(0).append($('<th class="catering-cellhead">').append($('<p>').addClass('customview-p').html('&nbsp;')));
					head.eq(1).append($('<th class="catering-cellhead">').append($('<p>').addClass('customview-p').html('&nbsp;')));
					template.append($('<td class="catering-cellhead">'));
					for (var i=0;i<24;i++)
					{
						var hide='';
						if (i<parseInt(vars.config['starthour'])) hide='class="hide"';
						if (i>parseInt(vars.config['endhour'])) hide='class="hide"';
						head.eq(0).append($('<th colspan="'+vars.config['scale']+'" '+hide+'>').text(i));
						for (var i2=0;i2<parseInt(vars.config['scale']);i2++)
						{
							head.eq(1).append($('<th '+hide+'>'));
							template.append($('<td '+hide+'>'));
						}
					}
					vars.table=$('<table id="catering" class="customview-table catering">').mergetable({
						container:container,
						head:head,
						template:template,
						merge:false,
						mergeclass:'catering-merge'
					});
					/* get fields of app */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
						vars.fieldinfos=$.fieldparallelize(resp.properties);
						functions.loadmealplaces(function(){
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
