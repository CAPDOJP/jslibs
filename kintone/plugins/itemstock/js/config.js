/*
*--------------------------------------------------------------------
* jQuery-Plugin "itemstock -config.js-"
* Version: 1.0
* Copyright (c) 2018 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	var vars={
		offset:0,
		itemcolumntable:null,
		appinfos:{},
		fieldinfos:{}
	};
	var VIEW_NAME=['在庫一覧'];
	var functions={
		fieldsort:function(layout){
			var codes=[];
			$.each(layout,function(index,values){
				switch (values.type)
				{
					case 'ROW':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push(values.code);
						});
						break;
					case 'GROUP':
						$.merge(codes,functions.fieldsort(values.layout));
						break;
					case 'SUBTABLE':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push(values.code);
						});
						break;
				}
			});
			return codes;
		},
		loadapps:function(callback){
			kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{offset:vars.offset},function(resp){
				/* setup app lists */
				$.each(resp.apps,function(index,values){
					if (values.appId!=kintone.app.getId())
					{
						$('select#itemapp').append($('<option>').attr('value',values.appId).text(values.name));
						$('select#shipmentapp').append($('<option>').attr('value',values.appId).text(values.name));
						$('select#arrivalapp').append($('<option>').attr('value',values.appId).text(values.name));
					}
				})
				vars.offset+=100;
				if (resp.apps.length==100) functions.loadapps(callback);
				else
				{
					if (callback!=null) callback();
				}
			},function(error){});
		},
		reloaditems:function(callback){
			var target=$('select#itemapp');
			/* initinalize elements */
			$('select#shipmentapp').val('');
			$('select#arrivalapp').val('');
			$('select#itemsafety').empty().append($('<option>').attr('value','').text(''));
			$('select#shipmentdate').empty().append($('<option>').attr('value','').text(''));
			$('select#shipmentitem').empty().append($('<option>').attr('value','').text(''));
			$('select#shipmentquantity').empty().append($('<option>').attr('value','').text(''));
			$('select#arrivaldate').empty().append($('<option>').attr('value','').text(''));
			$('select#arrivalitem').empty().append($('<option>').attr('value','').text(''));
			$('select#arrivalquantity').empty().append($('<option>').attr('value','').text(''));
			$('select#inventoryitem').empty().append($('<option>').attr('value','').text(''));
			/* clear rows */
			vars.itemcolumntable.clearrows();
			if (target.val().length!=0)
			{
				$.each(vars.fieldinfos,function(key,values){
					if (values.lookup)
						if (values.lookup.relatedApp.app==target.val())
							$('select#inventoryitem').append($('<option>').attr('value',values.code).text(values.label));
				});
				kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:target.val()},function(resp){
					var sorted=functions.fieldsort(resp.layout);
					/* get fieldinfo */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:target.val()},function(resp){
						var listcolumn=$('select#itemcolumn',vars.itemcolumntable.template).empty().append($('<option>').attr('value','').text(''));
						var listsafety=$('select#itemsafety');
						$.each(sorted,function(index){
							if (sorted[index] in resp.properties)
							{
								var fieldinfo=resp.properties[sorted[index]];
								/* check field type */
								switch (fieldinfo.type)
								{
									case 'CALC':
									case 'DATE':
									case 'DATETIME':
									case 'DROP_DOWN':
									case 'LINK':
									case 'NUMBER':
									case 'RADIO_BUTTON':
									case 'RECORD_NUMBER':
									case 'SINGLE_LINE_TEXT':
									case 'TIME':
										listcolumn.append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										if (fieldinfo.type=='NUMBER') listsafety.append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								}
							}
						});
						vars.itemcolumntable.addrow();
						vars.itemcolumntable.container.show();
						if (callback) callback();
					},function(error){vars.itemcolumntable.container.hide();});
				},function(error){vars.itemcolumntable.container.hide();});
			}
			else vars.itemcolumntable.container.hide();
		},
		reloadsettings:function(target,callback){
			var lookup=$('select#itemapp');
			var relationapp=$('select#'+target+'app');
			var relationdate=$('select#'+target+'date').empty().append($('<option>').attr('value','').text(''));
			var relationitem=$('select#'+target+'item').empty().append($('<option>').attr('value','').text(''));
			var relationquantity=$('select#'+target+'quantity').empty().append($('<option>').attr('value','').text(''));
			if (relationapp.val().length!=0)
			{
				if (lookup.val().length==0)
				{
					swal('Error!','商品アプリを指定して下さい。','error');
					return;
				}
				kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:relationapp.val()},function(resp){
					var sorted=functions.fieldsort(resp.layout);
					/* get fieldinfo */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:relationapp.val()},function(resp){
						vars.appinfos[target]=$.fieldparallelize(resp.properties);
						/* initialize valiable */
						$.each(sorted,function(index){
							if (sorted[index] in vars.appinfos[target])
							{
								var fieldinfo=vars.appinfos[target][sorted[index]];
								/* check field type */
								switch (fieldinfo.type)
								{
									case 'CALC':
										switch(fieldinfo.format.toUpperCase())
										{
											case 'NUMBER':
											case 'NUMBER_DIGIT':
												relationquantity.append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
												break;
										}
										break;
									case 'DATE':
										if (fieldinfo.tablecode.length==0) relationdate.append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										break;
									case 'NUMBER':
										relationquantity.append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										break;
								}
								if (fieldinfo.lookup)
									if (fieldinfo.lookup.relatedApp.app==lookup.val())
										relationitem.append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
						});
						if (callback) callback();
					});
				},function(error){});
			}
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	functions.loadapps(function(){
		var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
			var sorted=functions.fieldsort(resp.layout);
			/* get fieldinfo */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				vars.fieldinfos=resp.properties;
				$.each(sorted,function(index){
					if (sorted[index] in vars.fieldinfos)
					{
						var fieldinfo=vars.fieldinfos[sorted[index]];
						/* check field type */
						switch (fieldinfo.type)
						{
							case 'DATE':
								$('select#inventorydate').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								break;
							case 'NUMBER':
								$('select#inventoryquantity').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								break;
						}
					}
				});
				/* initialize valiable */
				vars.itemcolumntable=$('.itemcolumns').adjustabletable({
					add:'img.add',
					del:'img.del'
				});
				var add=false;
				var row=null;
				var itemcolumns={};
				if (Object.keys(config).length!==0)
				{
					itemcolumns=JSON.parse(config['itemcolumns']);
					$('select#itemapp').val(config['itemapp']);
					functions.reloaditems(function(){
						$('select#itemsafety').val(config['itemsafety']);
						$('select#shipmentapp').val(config['shipmentapp']);
						$('select#arrivalapp').val(config['arrivalapp']);
						$('select#inventorydate').val(config['inventorydate']);
						$('select#inventoryitem').val(config['inventoryitem']);
						$('select#inventoryquantity').val(config['inventoryquantity']);
						add=false;
						$.each(itemcolumns,function(key,values){
							if (add) vars.itemcolumntable.addrow();
							else add=true;
							row=vars.itemcolumntable.rows.last();
							$('select#itemcolumn',row).val(key);
						});
						functions.reloadsettings('shipment',function(){
							$('select#shipmentdate').val(config['shipmentdate']);
							$('select#shipmentitem').val(config['shipmentitem']);
							$('select#shipmentquantity').val(config['shipmentquantity']);
						});
						functions.reloadsettings('arrival',function(){
							$('select#arrivaldate').val(config['arrivaldate']);
							$('select#arrivalitem').val(config['arrivalitem']);
							$('select#arrivalquantity').val(config['arrivalquantity']);
						});
					});
				}
				$('select#itemapp').on('change',function(){functions.reloaditems();});
				$('select#shipmentapp').on('change',function(){functions.reloadsettings('shipment');});
				$('select#arrivalapp').on('change',function(){functions.reloadsettings('arrival');});
			});
		},function(error){});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var itemcolumns={};
		/* check values */
		if ($('select#itemapp').val()=='')
		{
			swal('Error!','商品アプリを入力して下さい。','error');
			return;
		}
		if ($('select#shipmentapp').val()=='')
		{
			swal('Error!','出庫アプリを入力して下さい。','error');
			return;
		}
		if ($('select#shipmentdate').val()=='')
		{
			swal('Error!','出庫日フィールドを入力して下さい。','error');
			return;
		}
		if ($('select#shipmentitem').val()=='')
		{
			swal('Error!','出庫商品フィールドを入力して下さい。','error');
			return;
		}
		if ($('select#shipmentquantity').val()=='')
		{
			swal('Error!','出庫数量フィールドを入力して下さい。','error');
			return;
		}
		if ($('select#arrivalapp').val()=='')
		{
			swal('Error!','入庫アプリを入力して下さい。','error');
			return;
		}
		if ($('select#arrivaldate').val()=='')
		{
			swal('Error!','入庫日フィールドを入力して下さい。','error');
			return;
		}
		if ($('select#arrivalitem').val()=='')
		{
			swal('Error!','入庫商品フィールドを入力して下さい。','error');
			return;
		}
		if ($('select#arrivalquantity').val()=='')
		{
			swal('Error!','入庫数量フィールドを入力して下さい。','error');
			return;
		}
		if ($('select#inventorydate').val()=='')
		{
			swal('Error!','棚卸日フィールドを入力して下さい。','error');
			return;
		}
		if ($('select#inventoryitem').val()=='')
		{
			swal('Error!','棚卸商品フィールドを入力して下さい。','error');
			return;
		}
		if ($('select#inventoryquantity').val()=='')
		{
			swal('Error!','棚卸数量フィールドを入力して下さい。','error');
			return;
		}
		for (var i=0;i<vars.itemcolumntable.rows.length;i++)
		{
			row=vars.itemcolumntable.rows.eq(i);
			if ($('select#itemcolumn',row).val().length!=0) itemcolumns[$('select#itemcolumn',row).val()]=$('select#itemcolumn option:selected',row).text();
		}
		if (Object.keys(itemcolumns).length==0)
		{
			swal('Error!','表示フィールドは1つ以上指定して下さい。','error');
			return;
		}
		if (vars.appinfos['shipment'][$('select#shipmentitem').val()].tablecode!=vars.appinfos['shipment'][$('select#shipmentquantity').val()].tablecode)
		{
			swal('Error!','出庫商品と出庫数量の指定は同一テーブルにして下さい。。','error');
			return;
		}
		if (vars.appinfos['arrival'][$('select#arrivalitem').val()].tablecode!=vars.appinfos['arrival'][$('select#arrivalquantity').val()].tablecode)
		{
			swal('Error!','入庫商品と入庫数量の指定は同一テーブルにして下さい。。','error');
			return;
		}
		/* setup config */
		config['itemapp']=$('select#itemapp').val();
		config['itemsafety']=$('select#itemsafety').val();
		config['shipmentapp']=$('select#shipmentapp').val();
		config['shipmentdate']=$('select#shipmentdate').val();
		config['shipmentitem']=$('select#shipmentitem').val();
		config['shipmentquantity']=$('select#shipmentquantity').val();
		config['arrivalapp']=$('select#arrivalapp').val();
		config['arrivaldate']=$('select#arrivaldate').val();
		config['arrivalitem']=$('select#arrivalitem').val();
		config['arrivalquantity']=$('select#arrivalquantity').val();
		config['inventorydate']=$('select#inventorydate').val();
		config['inventoryitem']=$('select#inventoryitem').val();
		config['inventoryquantity']=$('select#inventoryquantity').val();
		config['itemcolumns']=JSON.stringify(itemcolumns);
		/* get view lists */
		kintone.api(kintone.api.url('/k/v1/preview/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
			var req=$.extend(true,{},resp);
			req.app=kintone.app.getId();
			$.each(VIEW_NAME,function(index){
				if (!req.views[VIEW_NAME[index]])
				{
					/* swaps the index */
					$.each(req.views,function(key,values){
						if ($.inArray(key,VIEW_NAME)<0) values.index=Number(values.index)+1;
					})
		   			/* create custom view */
					req.views[VIEW_NAME[index]]={
						type:'CUSTOM',
						name:VIEW_NAME[index],
						html:'<div id="itemstock-container" class="customview-container"></div>',
						filterCond:'',
						sort:'',
						pager:false,
						index:index
					};
				}
			});
			/* save viewid */
			kintone.api(kintone.api.url('/k/v1/preview/app/views',true),'PUT',req,function(resp){
				/* setup config */
				config['itemstocklist']=resp.views[VIEW_NAME[0]].id;
				/* save config */
				kintone.plugin.app.setConfig(config);
			},function(error){});
		},function(error){});
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);