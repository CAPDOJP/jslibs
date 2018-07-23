/*
*--------------------------------------------------------------------
* jQuery-Plugin "itemstock"
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
		limit:500,
		offset:0,
		calendar:null,
		splash:null,
		table:null,
		arrivalrecords:[],
		inventoryrecords:[],
		shipmentrecords:[],
		storagerecords:[],
		appfields:{},
		config:{},
		columns:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var functions={
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			vars.splash.removeClass('hide');
			vars.offset=0;
			vars.shipmentrecords=[];
			functions.loaddatas(vars.config['shipmentapp'],vars.config['shipmentdate'],vars.shipmentrecords,function(){
				vars.offset=0;
				vars.arrivalrecords=[];
				functions.loaddatas(vars.config['arrivalapp'],vars.config['arrivaldate'],vars.arrivalrecords,function(){
					vars.offset=0;
					vars.inventoryrecords=[];
					functions.loaddatas(kintone.app.getId(),vars.config['inventorydate'],vars.inventoryrecords,function(){
						/* calulate */
						var tablecode='';
						var record={};
						var shipmentitems={};
						var arrivalitems={};
						var inventoryitems={};
						var setupitem=function(record,header,items,target){
							var item='';
							var quantity='';
							var storage='';
							if (vars.config['storageapp'])
								if ($('.itemstock-storage').val())
								{
									if (vars.appfields[target][vars.config[target+'storage']].tablecode) storage=record[vars.config[target+'storage']].value;
									else storage=header[vars.config[target+'storage']].value;
									if (storage!=vars.storagerecords[0][vars.appfields[target][vars.config[target+'storage']].lookup.relatedKeyField].value) return;
								}
							item=record[vars.config[target+'item']].value;
							quantity=record[vars.config[target+'quantity']].value;
							if (item && quantity)
							{
								if (!(item in items)) items[item]=0;
								items[item]+=parseFloat(quantity);
							}
						};
						tablecode=vars.appfields['shipment'][vars.config['shipmentitem']].tablecode;
						for (var i=0;i<vars.shipmentrecords.length;i++)
						{
							record=vars.shipmentrecords[i];
							if (tablecode)
							{
								for (var i2=0;i2<record[tablecode].value.length;i2++)
									setupitem(record[tablecode].value[i2].value,record,shipmentitems,'shipment');
							}
							else setupitem(record,record,shipmentitems,'shipment');
						}
						tablecode=vars.appfields['arrival'][vars.config['arrivalitem']].tablecode;
						for (var i=0;i<vars.arrivalrecords.length;i++)
						{
							record=vars.arrivalrecords[i];
							if (tablecode)
							{
								for (var i2=0;i2<record[tablecode].value.length;i2++)
									setupitem(record[tablecode].value[i2].value,record,arrivalitems,'arrival');
							}
							else setupitem(record,record,arrivalitems,'arrival');
						}
						for (var i=0;i<vars.inventoryrecords.length;i++)
						{
							record=vars.inventoryrecords[i];
							setupitem(record,record,inventoryitems,'inventory');
						}
						$.each(vars.table.contents.find('tr'),function(index){
							var row=vars.table.contents.find('tr').eq(index);
							var shipmentitem=$('input#'+vars.appfields['shipment'][vars.config['shipmentitem']].lookup.relatedKeyField,row).val();
							var arrivalitem=$('input#'+vars.appfields['arrival'][vars.config['arrivalitem']].lookup.relatedKeyField,row).val();
							var inventoryitem=$('input#'+vars.appfields['inventory'][vars.config['inventoryitem']].lookup.relatedKeyField,row).val();
							var shipmentquantity=(shipmentitem in shipmentitems)?shipmentitems[shipmentitem]:0;
							var arrivalquantity=(arrivalitem in arrivalitems)?arrivalitems[arrivalitem]:0;
							var inventoryquantity=(inventoryitem in inventoryitems)?inventoryitems[inventoryitem]:0;
							var stock=arrivalquantity+inventoryquantity-shipmentquantity;
							$('td#stock',row).text((stock).toString());
							$('input',$('td#quantity',row)).first().val((stock).toString());
							if (vars.config['storageapp'])
							{
								if ($('.itemstock-storage').val()) $('input',$('td#quantity',row)).first().prop('disabled',false);
								else $('input',$('td#quantity',row)).first().prop('disabled',true);
							}
							functions.safetycheck(row,stock);
						});
						vars.splash.addClass('hide');
					});
				});
			});
		},
		/* reload datas */
		loaddatas:function(appkey,date,records,callback){
			var body={
				app:appkey,
				query:''
			};
			body.query+=date+'<"'+vars.date.calc('1 day').format('Y-m-d')+'"';
			body.query+=' order by $id asc limit '+vars.limit.toString()+' offset '+vars.offset.toString();
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(appkey,date,records,callback);
				else callback();
			},function(error){
				vars.splash.addClass('hide');
				swal('Error!',error.message,'error');
			});
		},
		/* reload item datas */
		loaditems:function(records,callback){
			var body={
				app:vars.config['itemapp'],
				query:''
			};
			body.query+=' order by ';
			$.each(vars.columns,function(key,values){
				body.query+=key+' asc,';
			});
			body.query=body.query.replace(/,$/g,'');
			body.query+=' limit '+vars.limit.toString()+' offset '+vars.offset.toString()
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaditems(records,callback);
				else callback(records);
			},function(error){
				vars.splash.addClass('hide');
				swal('Error!',error.message,'error');
			});
		},
		/* reload storage datas */
		loadstorages:function(records,callback){
			if (vars.config['storageapp'])
			{
				var body={
					app:vars.config['storageapp'],
					query:''
				};
				body.query+=' order by $id asc limit '+vars.limit.toString()+' offset '+vars.offset.toString()
				kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
					Array.prototype.push.apply(records,resp.records);
					vars.offset+=vars.limit;
					if (resp.records.length==vars.limit) functions.loadstorages(records,callback);
					else callback(records);
				},function(error){
					vars.splash.addClass('hide');
					swal('Error!',error.message,'error');
				});
			}
			else callback([]);
		},
		/* safety stock check */
		safetycheck:function(row,stock){
			if (vars.config['itemsafety'])
			{
				var safetystock=$('input#'+vars.config['itemsafety'],row).val();
				if (safetystock)
				{
					if (parseFloat(safetystock)>stock) $('td#stock',row).addClass('unsafety');
					else  $('td#stock',row).removeClass('unsafety');
				}
				else  $('td#stock',row).removeClass('unsafety');
			}
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check viewid */
		if (event.viewId!=vars.config.itemstocklist) return;
		/* initialize valiable */
		var container=$('div#itemstock-container');
		var feed=$('<div class="itemstock-headermenucontents">');
		var day=$('<span id="day" class="customview-span">');
		var pick=$('<button id="datepick" class="customview-button calendar-button">');
		var prev=$('<button id="prev" class="customview-button prev-button">');
		var next=$('<button id="next" class="customview-button next-button">');
		var storage=$('<div class="kintoneplugin-select-outer">').append($('<div class="kintoneplugin-select">').append($('<select class="itemstock-storage">')));
		var week=['日','月','火','水','木','金','土'];
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
		feed.append(storage);
		feed.append(prev);
		feed.append(day);
		feed.append(pick);
		feed.append(next);
		if ($('.itemstock-headermenucontents').size()) $('.itemstock-headermenucontents').remove();
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed[0]);
		$('body').append(vars.splash);
		/* setup date value */
		day.text(vars.date.format('Y-m-d')+' ('+week[vars.date.getDay()]+')');
		/* day pickup button */
		vars.calendar=$('body').calendar({
			selected:function(target,value){
				vars.date=new Date(value.dateformat());
				day.text(value+' ('+week[vars.date.getDay()]+')');
				/* reload view */
				functions.load();
			}
		});
		pick.on('click',function(){
			vars.calendar.show({activedate:vars.date});
		});
		/* day feed button */
		$.each([prev,next],function(){
			$(this).on('click',function(){
				var days=($(this).attr('id')=='next')?1:-1;
				vars.date=vars.date.calc(days+' day');
				day.text(vars.date.format('Y-m-d')+' ('+week[vars.date.getDay()]+')');
				/* reload view */
				functions.load();
			});
		});
		/* load item records */
		vars.offset=0;
		vars.columns=JSON.parse(vars.config['itemcolumns']);
		functions.loaditems([],function(records){
			var items=records;
			/* load storage records */
			vars.offset=0;
			vars.storagerecords=[];
			functions.loadstorages([],function(records){
				$('.itemstock-storage').append($('<option>').attr('value','').html('&nbsp;全て&nbsp;'));
				if (records.length!=0)
				{
					for (var i=0;i<records.length;i++)
						$('.itemstock-storage').append($('<option>').attr('value',records[i]['$id'].value).html('&nbsp;'+records[i][vars.config['storagename']].value+'&nbsp;'));
					$('.itemstock-storage').on('change',function(){
						var target=$(this);
						if (target.val())
						{
							vars.storagerecords=$.grep(records,function(item,index){
								return item['$id'].value==target.val();
							});
						}
						else vars.storagerecords=[];
						/* reload view */
						functions.load();
					});
				}
				else storage.hide();
				/* get fields of app */
				kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:vars.config['shipmentapp']},function(resp){
					vars.appfields['shipment']=$.fieldparallelize(resp.properties);
					if (!(vars.config['shipmentdate'] in vars.appfields['shipment']))
					{
						vars.splash.addClass('hide');
						swal('Error!','出庫日フィールドの設定を確認して下さい。','error');
						return;
					}
					if (!(vars.config['shipmentitem'] in vars.appfields['shipment']))
					{
						vars.splash.addClass('hide');
						swal('Error!','出庫商品フィールドの設定を確認して下さい。','error');
						return;
					}
					if (vars.config['shipmentstorage'])
						if (!(vars.config['shipmentstorage'] in vars.appfields['shipment']))
						{
							vars.splash.addClass('hide');
							swal('Error!','出庫倉庫・店舗フィールドの設定を確認して下さい。','error');
							return;
						}
					if (!(vars.config['shipmentquantity'] in vars.appfields['shipment']))
					{
						vars.splash.addClass('hide');
						swal('Error!','出庫数量フィールドの設定を確認して下さい。','error');
						return;
					}
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:vars.config['arrivalapp']},function(resp){
						vars.appfields['arrival']=$.fieldparallelize(resp.properties);
						if (!(vars.config['arrivaldate'] in vars.appfields['arrival']))
						{
							vars.splash.addClass('hide');
							swal('Error!','入庫日フィールドの設定を確認して下さい。','error');
							return;
						}
						if (!(vars.config['arrivalitem'] in vars.appfields['arrival']))
						{
							vars.splash.addClass('hide');
							swal('Error!','入庫商品フィールドの設定を確認して下さい。','error');
							return;
						}
						if (vars.config['arrivalstorage'])
							if (!(vars.config['arrivalstorage'] in vars.appfields['arrival']))
							{
								vars.splash.addClass('hide');
								swal('Error!','入庫倉庫・店舗フィールドの設定を確認して下さい。','error');
								return;
							}
						if (!(vars.config['arrivalquantity'] in vars.appfields['arrival']))
						{
							vars.splash.addClass('hide');
							swal('Error!','入庫数量フィールドの設定を確認して下さい。','error');
							return;
						}
						kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
							vars.appfields['inventory']=resp.properties;
							if (!(vars.config['inventorydate'] in vars.appfields['inventory']))
							{
								vars.splash.addClass('hide');
								swal('Error!','棚卸日フィールドの設定を確認して下さい。','error');
								return;
							}
							if (!(vars.config['inventoryitem'] in vars.appfields['inventory']))
							{
								vars.splash.addClass('hide');
								swal('Error!','棚卸商品フィールドの設定を確認して下さい。','error');
								return;
							}
							if (vars.config['inventorystorage'])
								if (!(vars.config['inventorystorage'] in vars.appfields['inventory']))
								{
									vars.splash.addClass('hide');
									swal('Error!','棚卸倉庫・店舗フィールドの設定を確認して下さい。','error');
									return;
								}
							if (!(vars.config['inventoryquantity'] in vars.appfields['inventory']))
							{
								vars.splash.addClass('hide');
								swal('Error!','棚卸数量フィールドの設定を確認して下さい。','error');
								return;
							}
							/* create table */
							var head=$('<tr>');
							var template=$('<tr>');
							$.each(vars.columns,function(key,values){
								head.append($('<th>').text(values));
								template.append($('<td class="'+key+'">'));
							});
							head.append($('<th>').text('理論在庫'));
							head.append($('<th>').text('実在庫'));
							template.append($('<td id="stock" class="right">'));
							template.append(
								$('<td id="quantity">').css({'padding':'0px','width':'100px'})
								.append(
									$('<input type="text" class="right">').css({'width':'100%'})
									.on('change',function(e){
										var row=$(this).closest('tr');
										var stock=($('td#stock',row).text())?parseFloat($('td#stock',row).text()):0;
										var quantity=($(this).val())?parseFloat($(this).val()):0;
										if (!stock) stock=0;
										if (!quantity) quantity=0;
										if (quantity-stock!=0)
										{
											var body={
												app:kintone.app.getId(),
												record:{}
											};
											body.record[vars.config['inventorydate']]={value:vars.date.format('Y-m-d')};
											body.record[vars.config['inventoryitem']]={value:$('input#'+vars.appfields['inventory'][vars.config['inventoryitem']].lookup.relatedKeyField,row).val()};
											body.record[vars.config['inventoryquantity']]={value:(quantity-stock).toString()};
											if (vars.storagerecords.length!=0)
												body.record[vars.config['inventorystorage']]={value:vars.storagerecords[0][vars.appfields['inventory'][vars.config['inventorystorage']].lookup.relatedKeyField].value};
											kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
												$('td#stock',row).text(quantity.toString());
												functions.safetycheck(row,quantity);
											},function(error){
												swal('Error!',error.message,'error');
											});
										}
									})
								)
							);
							container.empty();
							vars.table=$('<table class="customview-table itemstock">').mergetable({
								container:container,
								head:head,
								template:template,
								merge:false
							});
							/* insert row */
							for (var i=0;i<items.length;i++)
							{
								var record=items[i];
								vars.table.insertrow(null,function(row){
									$.each(vars.columns,function(key,values){
										$('.'+key,row).html(record[key].value);
									});
									$.each(record,function(key,values){
										if (key==vars.appfields['shipment'][vars.config['shipmentitem']].lookup.relatedKeyField)
											if (!$('input#'+key,row).size())
												$('td#quantity',row).append($('<input type="hidden">').attr('id',key).val(values.value));
										if (key==vars.appfields['arrival'][vars.config['arrivalitem']].lookup.relatedKeyField)
											if (!$('input#'+key,row).size())
												$('td#quantity',row).append($('<input type="hidden">').attr('id',key).val(values.value));
										if (key==vars.appfields['inventory'][vars.config['inventoryitem']].lookup.relatedKeyField)
											if (!$('input#'+key,row).size())
												$('td#quantity',row).append($('<input type="hidden">').attr('id',key).val(values.value));
										if (vars.config['itemsafety'])
											if (key==vars.config['itemsafety'])
												if (!$('input#'+key,row).size())
													$('td#quantity',row).append($('<input type="hidden">').attr('id',key).val(values.value));
									});
								});
							}
							/* reload view */
							functions.load();
						},function(error){
							vars.splash.addClass('hide');
							swal('Error!',error.message,'error');
						});
					},function(error){
						vars.splash.addClass('hide');
						swal('Error!',error.message,'error');
					});
				},function(error){
					vars.splash.addClass('hide');
					swal('Error!',error.message,'error');
				});
			});
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
