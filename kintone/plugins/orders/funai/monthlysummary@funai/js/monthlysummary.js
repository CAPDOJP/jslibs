/*
*--------------------------------------------------------------------
* jQuery-Plugin "monthlysummary"
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
		splash:null,
		table:null,
		year:parseInt(new Date().format('Y')),
		config:{},
		fieldinfos:{},
		views:{},
		calculations:[],
		summaries:[],
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var functions={
		/* record summary */
		summary:function(row,records,summary){
			var basemonth=new Date((vars.year.toString()+'-'+vars.config.basemonth+'-1').dateformat());
			var tablecode=(function(field){
				if (field) return vars.fieldinfos[field].tablecode;
				return '';
			})(summary.date);
			var totalamount=(function(){
				var res=0;
				for (var i=0;i<records.length;i++)
				{
					switch (summary.pattern)
					{
						case '2':
							for (var i2=0;i2<records[i][tablecode].value.length;i2++)
								res+=parseFloat(records[i][tablecode].value[i2].value[summary.field].value);
							break;
						case '8':
							res++;
							break;
					}
				}
				return res;
			})();
			for (var i=0;i<12;i++)
			{
				var counter=0;
				var amount=0;
				var monthlyamount=0;
				var fromdate=basemonth.calc(i.toString()+' month');
				var todate=fromdate.calc('1 month').calc('-1 day');
				(function(filter){
					var res=[];
					for (var i2=0;i2<filter.length;i2++)
					{
						var match=$.conditionsmatch(filter[i2],vars.fieldinfos,JSON.parse(summary.conditions));
						if (match)
						{
							switch (summary.pattern)
							{
								case '0':
								case '1':
								case '2':
								case '3':
								case '4':
								case '5':
									for (var i3=0;i3<match[tablecode].value.length;i3++)
										amount+=parseFloat(match[tablecode].value[i3].value[summary.field].value);
									switch (summary.pattern)
									{
										case '5':
											counter++;
											break;
									}
									break;
								case '6':
								case '7':
								case '8':
								case '9':
									amount+=match[tablecode].value.length;
									break;
							}
						}
						switch (summary.pattern)
						{
							case '1':
								for (var i3=0;i3<filter[i2][tablecode].value.length;i3++)
									monthlyamount+=parseFloat(filter[i2][tablecode].value[i3].value[summary.field].value);
								break;
							case '7':
								monthlyamount+=filter[i2][tablecode].value.length;
								break;
						}
					}
					switch (summary.pattern)
					{
						case '4':
							totalamount+=amount;
							break;
					}
					return res;
				})((function(){
					var filter=[];
					for (var i2=0;i2<records.length;i2++)
					{
						var record=$.extend(true,{},records[i2]);
						var tablerecord=record[vars.fieldinfos[summary.date].tablecode].value;
						record[vars.fieldinfos[summary.date].tablecode].value=$.grep(tablerecord,function(item,index){
							var date=new Date(new Date(item.value[summary.date].value.dateformat()).format('Y-m-d').dateformat());
							return (date>=fromdate && date<=todate);
						});
						filter.push(record);
					}
					return filter;
				})());
				switch (summary.pattern)
				{
					case '0':
					case '3':
					case '9':
						row[i]=amount;
						break;
					case '1':
						if (monthlyamount!=0) row[i]=amount/monthlyamount*100;
						break;
					case '2':
						if (totalamount!=0) row[i]=amount/totalamount*100;
						break;
					case '4':
						row[i]=totalamount;
						break;
					case '5':
						if (counter!=0) row[i]=amount/counter;
						break;
					case '6':
						row[i]=amount;
						break;
					case '7':
						if (monthlyamount!=0) row[i]=amount/monthlyamount*100;
						break;
					case '8':
						if (totalamount!=0) row[i]=amount/totalamount*100;
						break;
				}
			}
		},
		/* reload view */
		load:function(){
			vars.splash.removeClass('hide');
			var counter=vars.summaries.length;
			var fromdate=new Date((vars.year.toString()+'-'+vars.config.basemonth+'-1').dateformat());
			var todate=fromdate.calc('12 month').calc('-1 day');
			var setuprecord=function(){
				for (var i=0;i<vars.summaries.length;i++)
					(function(row,record,denominators,summary){
						var unit=(function(field){
							if (field) return (vars.fieldinfos[field].unit)?vars.fieldinfos[field].unit:'';
							return '';
						})(summary.field);
						var unitposition=(function(field){
							if (field) return (vars.fieldinfos[field].unitPosition)?vars.fieldinfos[field].unitPosition.toUpperCase():'BEFORE';
							return '';
						})(summary.field);
						for (var i2=0;i2<12;i2++)
						{
							var cell=$('td',row).eq(i2+1);
							var denominator=0;
							switch (summary.pattern)
							{
								case '0':
									cell.text(record[i2].comma());
									if (unitposition=='BEFORE') cell.text(unit+cell.text());
									else cell.text(cell.text()+unit);
									break;
								case '1':
									cell.text(functions.rounding(record[i2]).comma()+'%');
									break;
								case '2':
									cell.text(functions.rounding(record[i2]).comma()+'%');
									break;
								case '3':
									denominator=denominators[parseInt(summary.denominator)][i2];
									if (denominator) cell.text(functions.rounding((record[i2]/denominator*100)).comma()+'%');
									else cell.text('0%');
									break;
								case '4':
									cell.text(record[i2].comma());
									if (unitposition=='BEFORE') cell.text(unit+cell.text());
									else cell.text(cell.text()+unit);
									break;
								case '5':
									cell.text(functions.rounding(record[i2]).comma());
									if (unitposition=='BEFORE') cell.text(unit+cell.text());
									else cell.text(cell.text()+unit);
									break;
								case '6':
									cell.text(record[i2].comma()+'件');
									break;
								case '7':
									cell.text(functions.rounding(record[i2]).comma()+'%');
									break;
								case '8':
									cell.text(functions.rounding(record[i2]).comma()+'%');
									break;
								case '9':
									denominator=denominators[parseInt(summary.denominator)][i2];
									if (denominator) cell.text(functions.rounding((record[i2]/denominator*100)).comma()+'%');
									else cell.text('0%');
									break;
							}
						}
					})($('tr',vars.table.contents).eq(i),vars.calculations[i],vars.calculations,vars.summaries[i]);
			};
			vars.calculations=[];
			for (var i=0;i<vars.summaries.length;i++)
			{
				vars.calculations.push([0,0,0,0,0,0,0,0,0,0,0,0]);
				(function(row,summary){
					functions.loaddatas([],summary.date,0,function(records){
						if (records.length!=0)
							for (var i2=0;i2<records.length;i2++)
							{
								var tablerecord=records[i2][vars.fieldinfos[summary.date].tablecode].value;
								records[i2][vars.fieldinfos[summary.date].tablecode].value=$.grep(tablerecord,function(item,index){
									var date=new Date(new Date(item.value[summary.date].value.dateformat()).format('Y-m-d').dateformat());
									return (date>=fromdate && date<=todate);
								});
							}
						functions.summary(row,records,summary);
						counter--;
						if (counter==0)
						{
							vars.splash.addClass('hide');
							setuprecord();
						}
					});
				})(vars.calculations[i],vars.summaries[i]);
			}
		},
		/* load app datas */
		loaddatas:function(records,date,offset,callback){
			var fromdate=new Date((vars.year.toString()+'-'+vars.config.basemonth+'-1').dateformat());
			var todate=fromdate.calc('12 month').calc('-1 day');
			var body={
				app:kintone.app.getId(),
				query:kintone.app.getQueryCondition()
			};
			body.query+=((body.query)?' and ':'');
			if (vars.fieldinfos[date].type=='DATE') body.query+=date+'>="'+fromdate.format('Y-m-d')+'" and '+date+'<="'+todate.format('Y-m-d')+'"';
			else body.query+=date+'>="'+fromdate.format('Y-m-d')+'T00:00:00+0900" and '+date+'<="'+todate.format('Y-m-d')+'T23:59:59+0900"';
			body.query+=' limit '+vars.limit.toString();
			body.query+=' offset '+offset.toString();
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(records,resp.records);
				offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(records,date,offset,callback);
				else callback(records);
			},function(error){
				vars.splash.addClass('hide');
				swal('Error!',error.message,'error');
			});
		},
		/* calculate rounding */
		rounding:function(value){
			var digit=1;
			var res=0;
			if (vars.config.digit>0) digit=Math.pow(10,parseInt(vars.config.digit));
			switch (vars.config.round)
			{
				case '1':
					res=Math.floor(value*digit)/digit;
					break;
				case '2':
					res=Math.ceil(value*digit)/digit;
					break;
				case '3':
					res=Math.round(value*digit)/digit;
					break;
			}
			return res;
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if ('views' in vars.config) vars.views=JSON.parse(vars.config.views);
		/* check viewid */
		if (!('_'+event.viewId.toString() in vars.views)) return event;
		/* get views of app */
		kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
			$.each(resp.views,function(key,values){
				if (values.type.toUpperCase()=='LIST' && values.id==event.viewId)
				{
					var setupyear=function(amount){
						vars.year+=amount;
						$('.monthlysummary-headermenucontents #year').text(vars.year.toString());
						/* reload view */
						functions.load();
					};
					/* initialize valiable */
					vars.summaries=vars.views['_'+event.viewId.toString()];
					vars.splash=$('<div id="splash">').append(
						$('<p>')
						.append($('<span>').text('now loading'))
						.append($('<span class="dot progress1">').text('.'))
						.append($('<span class="dot progress2">').text('.'))
						.append($('<span class="dot progress3">').text('.'))
						.append($('<span class="dot progress4">').text('.'))
						.append($('<span class="dot progress5">').text('.'))
					);
					/* append elements */
					$('.gaia-argoui-app-index-pager').hide();
					if ($('.monthlysummary-headermenucontents').size()) $('.monthlysummary-headermenucontents').remove();
					kintone.app.getHeaderMenuSpaceElement().appendChild(
						$('<div class="monthlysummary-headermenucontents">')
						.append($('<button class="customview-button prev-button">').on('click',function(){setupyear(-1)}))
						.append($('<span id="year" class="customview-span">'))
						.append($('<button class="customview-button next-button">').on('click',function(){setupyear(1)}))
						.append(
							$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/download.svg" class="customview-imagebutton" alt="ダウンロード" title="ダウンロード" />')
							.on('click',function(){
								var output='';
								output+=',';
								for (var i=0;i<12;i++)
								{
									output+=$('thead th',vars.table.container).eq(i+1).text();
									if (i<11) output+=',';
								}
								output+='\n';
								for (var i=0;i<vars.table.rows.length;i++)
									$.each($('td',vars.table.rows[i]),function(index){
										output+=$(this).text().replace(/,/g,'');
										if (index<12) output+=',';
										else output+='\n';
									});
								$.downloadtext(output,'SJIS',values.name+'.csv');
							})
						)[0]
					);
					$('body').append(vars.splash);
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
					/* get fields of app */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
						vars.fieldinfos=$.fieldparallelize(resp.properties);
						/* create table */
						var basemonth=new Date((vars.year.toString()+'-'+vars.config.basemonth+'-1').dateformat());
						var head=$('<tr>');
						var template=$('<tr>');
						head.append($('<th>'));
						template.append($('<td>'));
						for (var i=0;i<12;i++)
						{
							head.append($('<th>').text(basemonth.calc(i.toString()+' month').format('m')+'月'));
							template.append($('<td>'));
						}
						vars.table=$('<table id="monthlysummary" class="customview-table">').mergetable({
							container:$('div#view-list-data-gaia').empty(),
							head:head,
							template:template,
							merge:false
						});
						/* insert row */
						for (var i=0;i<vars.summaries.length;i++)
						{
							var summary=vars.summaries[i];
							vars.table.insertrow(null,function(row){
								$('td',row).first().text(summary.caption).css({'text-align':'left'});
								$('td',row).each(function(index){
									$(this).css({
										'background-color':'#'+summary.backcolor,
										'color':'#'+summary.forecolor,
										'text-align':'right'
									});
								});
							});
						}
						/* setup year value */
						setupyear(0);
					},function(error){swal('Error!',error.message,'error');});
				}
			})
		},function(error){swal('Error!',error.message,'error');});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
