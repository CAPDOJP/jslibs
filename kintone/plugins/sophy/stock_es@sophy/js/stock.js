/*
*--------------------------------------------------------------------
* jQuery-Plugin "stock"
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
		date:new Date(),
		splash:null,
		table:null,
		apps:{},
		config:{},
		offset:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var limit=500;
	var functions={
		checkapps:function(counter,param,callback){
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:param[counter].app},function(resp){
				var error='';
				var fieldinfos=$.fieldparallelize(resp.properties);
				switch (param[counter].appname)
				{
					case '洋書テキスト選択':
						if (!('shipmentdate' in fieldinfos)) error='発送日';
						if (!('textbook' in fieldinfos)) error='テキスト';
						break;
					case 'テキスト発注':
						if (!('arrivaldate' in fieldinfos)) error='入荷日';
						if (!('textbook' in fieldinfos)) error='テキスト';
						if (!('quantity' in fieldinfos)) error='数量';
						break;
					case '受講テキスト':
						if (!('code' in fieldinfos)) error='コード';
						if (!('name' in fieldinfos)) error='テキスト名';
						break;
				}
				if (error.length!=0)
				{
					vars.splash.addClass('hide');
					swal('Error!',name+'アプリ内に'+error+'フィールドが見つかりません。','error');
					return false;
				}
				counter++;
				if (counter<param.length) functions.checkapps(counter,param,callback);
				else callback();
			},
			function(error){
				vars.splash.addClass('hide');
				swal('Error!',error.message,'error');
			});
		},
		checkstockfield:function(properties){
			var error='';
			var fieldinfos=$.fieldparallelize(properties);
			if (!('date' in fieldinfos)) error='棚卸日';
			if (!('textbook' in fieldinfos)) error='テキスト';
			if (!('quantity' in fieldinfos)) error='差分';
			if (error.length!=0)
			{
				vars.splash.addClass('hide');
				swal('Error!','テキスト在庫一覧アプリ内に'+error+'フィールドが見つかりません。','error');
				return false;
			}
			else return true;
		},
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			vars.apps[kintone.app.getId()]=null;
			vars.offset[kintone.app.getId()]=0;
			functions.loaddatas(function(){
				vars.apps[vars.config['lecture']]=null;
				vars.offset[vars.config['lecture']]=0;
				functions.loadlectures(function(){
					vars.apps[vars.config['order']]=null;
					vars.offset[vars.config['order']]=0;
					functions.loadorders(function(){
						/* initialize table */
						vars.table.clearrows();
						/* insert row */
						for (var i=0;i<vars.apps[vars.config['textbook']].length;i++)
						{
							var textbook=vars.apps[vars.config['textbook']][i];
							vars.table.insertrow(null,function(row){
								var initem=0;
								var outitem=0;
								var record=null;
								for (var i2=0;i2<vars.apps[kintone.app.getId()].length;i2++)
									initem+=parseInt(vars.apps[kintone.app.getId()][i2]['quantity'].value);
								for (var i2=0;i2<vars.apps[vars.config['order']].length;i2++)
								{
									record=vars.apps[vars.config['order']][i2];
									if (record['textbook'].value==textbook['code'].value)
										if (record['quantity'].value)
											initem+=parseInt(record['quantity'].value);
								}
								outitem=$.grep(vars.apps[vars.config['lecture']],function(item,index){
									return (item['textbook'].value==textbook['code'].value);
								}).length;
								$('.textbook',row).text(textbook['code'].value);
								$('.textbookname',row).text(textbook['name'].value);
								$('.stock',row).text((initem-outitem).toString());
								$('#quantity',row).val('');
							});
						}
						vars.splash.addClass('hide');
					});
				});
			});
		},
		/* reload datas */
		loaddatas:function(callback){
			var query='';
			var body={
				app:kintone.app.getId(),
				query:''
			};
			query+='date<"'+vars.date.calc('1 day').format('Y-m-d')+'"';
			query+=' order by $id asc limit '+limit.toString()+' offset '+vars.offset[kintone.app.getId()].toString();
			body.query+=query;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[kintone.app.getId()]==null) vars.apps[kintone.app.getId()]=resp.records;
				else Array.prototype.push.apply(vars.apps[kintone.app.getId()],resp.records);
				vars.offset[kintone.app.getId()]+=limit;
				if (resp.records.length==limit) functions.loaddatas(callback);
				else callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		},
		/* reload lecture datas */
		loadlectures:function(callback){
			var query='';
			var body={
				app:vars.config['lecture'],
				query:''
			};
			query+='shipmentdate<"'+vars.date.calc('1 day').format('Y-m-d')+'" and shipmentdate!=""';
			query+=' order by $id asc limit '+limit.toString()+' offset '+vars.offset[vars.config['lecture']].toString();
			body.query+=query;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[vars.config['lecture']]==null) vars.apps[vars.config['lecture']]=resp.records;
				else Array.prototype.push.apply(vars.apps[vars.config['lecture']],resp.records);
				vars.offset[vars.config['lecture']]+=limit;
				if (resp.records.length==limit) functions.loadlectures(callback);
				else callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		},
		/* reload order datas */
		loadorders:function(callback){
			var query='';
			var body={
				app:vars.config['order'],
				query:''
			};
			query+='arrivaldate<"'+vars.date.calc('1 day').format('Y-m-d')+'" and arrivaldate!=""';
			query+=' order by $id asc limit '+limit.toString()+' offset '+vars.offset[vars.config['order']].toString();
			body.query+=query;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[vars.config['order']]==null) vars.apps[vars.config['order']]=resp.records;
				else Array.prototype.push.apply(vars.apps[vars.config['order']],resp.records);
				vars.offset[vars.config['order']]+=limit;
				if (resp.records.length==limit) functions.loadorders(callback);
				else callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		},
		/* reload textbook datas */
		loadtextbooks:function(callback){
			var body={
				app:vars.config['textbook'],
				query:' order by code asc limit '+limit.toString()+' offset '+vars.offset[vars.config['textbook']].toString()
			};
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[vars.config['textbook']]==null) vars.apps[vars.config['textbook']]=resp.records;
				else Array.prototype.push.apply(vars.apps[vars.config['textbook']],resp.records);
				vars.offset[vars.config['textbook']]+=limit;
				if (resp.records.length==limit) functions.loadtextbooks(callback);
				else callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		},
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check viewid */
		if (event.viewId!=vars.config.stocklist) return;
		/* initialize valiable */
		var container=$('div#stock-container');
		var feed=$('<div class="stock-headermenucontents">');
		var day=$('<span id="day" class="customview-span">');
		var prev=$('<button id="prev" class="customview-button prev-button">');
		var next=$('<button id="next" class="customview-button next-button">');
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
		feed.append(prev);
		feed.append(day);
		feed.append(next);
		if ($('.custom-elements').size()) $('.custom-elements').remove();
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed.addClass('custom-elements')[0]);
		$('body').append(vars.splash);
		/* setup date value */
		day.text(vars.date.format('Y-m-d'));
		/* day feed button */
		$.each([prev,next],function(){
			$(this).on('click',function(){
				var days=($(this).attr('id')=='next')?1:-1;
				vars.date=vars.date.calc(days+' day');
				day.text(vars.date.format('Y-m-d'));
				/* reload view */
				functions.load();
			});
		});
		/* check app fields */
		var counter=0;
		var param=[];
		param.push({
			app:vars.config['lecture'],
			appname:'洋書テキスト選択',
			limit:limit,
			offset:0,
			records:[],
			ischeckonly:true
		});
		param.push({
			app:vars.config['order'],
			appname:'テキスト発注',
			limit:limit,
			offset:0,
			records:[],
			ischeckonly:true
		});
		param.push({
			app:vars.config['textbook'],
			appname:'受講テキスト',
			limit:limit,
			offset:0,
			records:[],
			ischeckonly:false
		});
		functions.checkapps(counter,param,function(){
			/* get fields of app */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				/* check app fields */
				if (!functions.checkstockfield(resp.properties)) return;
				vars.apps[vars.config['textbook']]=null;
				vars.offset[vars.config['textbook']]=0;
				functions.loadtextbooks(function(){
					vars.splash.addClass('hide');
					/* create table */
					var head=$('<tr>');
					var template=$('<tr>');
					var columns=[
						'textbook',
						'textbookname',
						'stock',
						'quantity'
					];
					head.append($('<th>').text('コード'));
					head.append($('<th>').text('名称'));
					head.append($('<th>').text('理論在庫'));
					head.append($('<th>').text('実在庫'));
					for (var i=0;i<columns.length;i++)
					{
						switch (columns[i])
						{
							case 'quantity':
								var cell=$('<input type="text" id="'+columns[i]+'" class="right">').css({'width':'100%'})
								.on('change',function(){
									var row=$(this).closest('tr');
									var id=$('.textbook',row).text();
									var stock=$('.stock',row).text();
									var quantity=$(this).val();
									if (!stock) stock='0';
									if (!quantity) quantity='0';
									if (quantity-stock!=0)
									{
										var body={
											app:kintone.app.getId(),
											record:{
												date:{value:vars.date.format('Y-m-d')},
												textbook:{value:id},
												quantity:{value:(quantity-stock).toString()}
											}
										};
										kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
											$('.stock',row).text(quantity.toString());
											$('#quantity',row).val('');
										},function(error){
											swal('Error!',error.message,'error');
										});
									}
								});
								template.append($('<td class="'+columns[i]+'">').css({'padding':'0px','width':'100px'}).append(cell));
								break;
							default:
								template.append($('<td class="'+columns[i]+'">'));
								break;
						}
					}
					container.empty();
					vars.table=$('<table id="stock" class="customview-table stock">').mergetable({
						container:container,
						head:head,
						template:template,
						merge:false
					});
					/* reload view */
					functions.load();
				});
			},
			function(error){
				swal('Error!',error.message,'error');
			});
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
