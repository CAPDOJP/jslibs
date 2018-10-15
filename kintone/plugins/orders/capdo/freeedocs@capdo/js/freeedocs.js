/*
*--------------------------------------------------------------------
* jQuery-Plugin "freeedocs"
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
		accesstoken:'',
		limit:500,
		offset:0,
		config:{},
		fieldinfos:{},
		documents:[],
		records:[]
	};
	var events={
		lists:[
			'app.record.index.show'
		],
		show:[
			'app.record.detail.show'
		]
	};
	var functions={
		/* create request datas */
		createrequest:function(record){
			var tablecode='';
			var request={};
			var docitems=[];
			request['company_id']=parseInt($('select.companies').val());
			request['type']=vars.config['doctype'];
			request['partner_id']=functions.createrequestvalue(record,vars.config['partner_id'],'integer');
			request['partner_name']=functions.createrequestvalue(record,vars.config['partner_name']);
			request['partner_zipcode']=functions.createrequestvalue(record,vars.config['partner_zipcode']);
			request['partner_prefecture_code']=functions.createrequestvalue(record,vars.config['partner_prefecture_code'],'integer');
			request['partner_address1']=functions.createrequestvalue(record,vars.config['partner_address1']);
			request['partner_address2']=functions.createrequestvalue(record,vars.config['partner_address2']);
			request['partner_info']=functions.createrequestvalue(record,vars.config['partner_info']);
			request['company_info']=functions.createrequestvalue(record,vars.config['company_info']);
			request['description']=functions.createrequestvalue(record,vars.config['description']);
			request['issue_date']=functions.createrequestvalue(record,vars.config['issue_date']);
			request['sales_added_date']=functions.createrequestvalue(record,vars.config['sales_added_date']);
			request['payment_date']=functions.createrequestvalue(record,vars.config['payment_date']);
			request['bank_info']=functions.createrequestvalue(record,vars.config['bank_info']);
			request['doc_reference_id']=functions.createrequestvalue(record,vars.config['doc_reference_id']);
			request['notes']=functions.createrequestvalue(record,vars.config['notes']);
			request['tax_entry_method']=vars.config['taxshift'];
			request['status']='0';
			if (!request['partner_id']) return null;
			if (!request['issue_date']) return null;
			tablecode=vars.fieldinfos[vars.config['qty']].tablecode;
			if (tablecode.length!=0)
			{
				for (var i=0;i<record[tablecode].value.length;i++)
				{
					var docitem={};
					var row=record[tablecode].value[i].value;
					var rowtypes=JSON.parse(vars.config['rowtypeoptions']);
					var type=0;
					switch (Object.values(rowtypes).indexOf(row[vars.config['rowtype']].value))
					{
						case 0:
							type=0;
							break;
						case 1:
							type=1;
							break;
						case 2:
							type=3;
							break;
					}
					docitem['order']=i;
					docitem['qty']=(type!=3)?functions.createrequestvalue(row,vars.config['qty'],'integer'):null;
					docitem['unit']=(type!=3)?functions.createrequestvalue(row,vars.config['unit']):null;
					docitem['unit_price']=functions.createrequestvalue(row,vars.config['unit_price'],'integer');
					docitem['description']=functions.createrequestvalue(row,vars.config['breakdown']);
					docitem['account_item_id']=(type!=3)?functions.createrequestvalue(row,vars.config['account_item_id'],'integer'):null;
					docitem['item_name']=(type!=3)?functions.createrequestvalue(row,vars.config['item_name']):null;
					docitem['section_name']=(type!=3)?functions.createrequestvalue(row,vars.config['section_name']):null;
					docitem['type']=type;
					docitems.push(docitem);
				}
			}
			request['doc_items']=docitems;
			if (request['doc_items'].length==0) return null;
			return request;
		},
		createrequestvalue:function(record,field,number){
			var res=null;
			if (field in record)
			{
				if (record[field].value)
					if (record[field].value.toString().length!=0)
					{
						switch (number)
						{
							case 'integer':
								res=parseInt(record[field].value);
								break;
							case 'float':
								res=parseFloat(record[field].value);
								break;
							default:
								res=record[field].value;
								break;
						}
					}
			}
			return res;
		},
		/* get companies */
		getcompanies:function(type){
			kintone.proxy(
				'https://api.freee.co.jp/api/1/companies',
				'GET',
				{
					'Authorization':'Bearer '+vars.accesstoken
				},
				{},
				function(body,status,headers){
					if (status==200)
					{
						var json=JSON.parse(body);
						kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
							vars.fieldinfos=$.fieldparallelize(resp.properties);
							var companies=$('<div class="kintoneplugin-select-outer">').append($('<div class="kintoneplugin-select">').append($('<select class="companies">')));
							var register=$('<button type="button" class="kintoneplugin-button-dialog-ok register">');
							var sync=$('<button type="button" class="kintoneplugin-button-dialog-ok sync">');
							/* setup elements */
							$('select',companies).append($('<option>').attr('value','').html('&nbsp;事業所選択&nbsp;'));
							for (var i=0;i<json.companies.length;i++)
							{
								var company=json.companies[i];
								$('select',companies).append($('<option>').attr('value',company.id).html('&nbsp;'+company.display_name+'&nbsp;'));
							}
							register.text('Freeeへ取引登録').on('click',function(e){
								if ($('select.companies').val().length==0)
								{
									swal('Error!','事業所を選択して下さい。','error');
									return;
								}
								swal({
									title:'確認',
									text:'Freeeに取引データを登録します。宜しいですか？',
									type:'info',
									showCancelButton:true,
									cancelButtonText:'Cancel'
								},
								function(){
									functions.registerfreee(type);
								});
							});
							/* clear elements */
							if ($('.custom-elements').size()) $('.custom-elements').remove();
							/* append elements */
							if (type=='list')
							{
								sync.text('発行ステータス同期').on('click',function(e){
									if ($('select.companies').val().length==0)
									{
										swal('Error!','事業所を選択して下さい。','error');
										return;
									}
									swal({
										title:'確認',
										text:'Freeeに登録済みの書類と発行ステータスの同期を行います。宜しいですか？',
										type:'info',
										showCancelButton:true,
										cancelButtonText:'Cancel'
									},
									function(){
										functions.syncfreee();
									});
								});
								kintone.app.getHeaderMenuSpaceElement().appendChild(companies.addClass('custom-elements')[0]);
								kintone.app.getHeaderMenuSpaceElement().appendChild(register.addClass('custom-elements')[0]);
								kintone.app.getHeaderMenuSpaceElement().appendChild(sync.addClass('custom-elements')[0]);
							}
							else
							{
								if ($('.gaia-app-statusbar').is(':visible')) $('.gaia-app-statusbar').css({'margin-right':'8px'});
								$('.gaia-argoui-app-toolbar-statusmenu').append(companies.addClass('custom-elements'));
								$('.gaia-argoui-app-toolbar-statusmenu').append(register.addClass('custom-elements'));
							}
						});
					}
					else
					{
						swal('Error!','事業所一覧データの取得に失敗しました。','error');
					}
				},
				function(error){
					swal('Error!','Freeeへの接続に失敗しました。','error');
				}
			);
		},
		/* get token */
		gettoken:function(type,callback){
			/* get access token */
			var regex=new RegExp("access_token=([^&#]*)");
			var results=regex.exec(window.location.href);
			if (results!=null)
			{
				vars.accesstoken=decodeURIComponent(results[1].replace(/\+/g," "));
				callback();
			}
			else
			{
				/* redirect authorize url */
				if (type=='list')
				{
					var authurl='https://secure.freee.co.jp/oauth/authorize?response_type=token';
					authurl+='&client_id='+vars.config['freeeappid'];
					authurl+='&redirect_uri='+encodeURI(decodeURI(window.location.href));
					window.location.href=authurl;
				}
			}
		},
		/* load app datas */
		loaddatas:function(callback){
			var sort='';
			var body={
				app:kintone.app.getId(),
				query:kintone.app.getQueryCondition()
			};
			sort=' order by $id asc limit '+vars.limit.toString()+' offset '+vars.offset.toString();
			body.query+=sort;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(vars.records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(callback);
				else callback();
			},function(error){
				functions.hideloading();
				swal('Error!',error.message,'error');
			});
		},
		/* load freee documents */
		loaddocs:function(callback){
			kintone.proxy(
				'https://api.freee.co.jp/api/1/docs?company_id='+$('select.companies').val()+'&doc_type='+vars.config['doctype']+'&limit=100'+'&offset='+vars.offset.toString(),
				'GET',
				{
					'Authorization':'Bearer '+vars.accesstoken
				},
				{},
				function(body,status,headers){
					if (status==200)
					{
						Array.prototype.push.apply(vars.documents,JSON.parse(body)['docs']);
						vars.offset+=100;
						if (JSON.parse(body)['docs'].length==100) functions.loaddocs(callback);
						else callback();
					}
					else
					{
						functions.hideloading();
						swal('Error!','Freeeデータのダウンロードに失敗しました。','error');
					}
				},
				function(error){
					functions.hideloading();
					swal('Error!','Freeeへの接続に失敗しました。','error');
				}
			);
		},
		/* register */
		registerfreee:function(type){
			var request={};
			var register=function(requests,updates){
				var error=false;
				var counter=requests.length;
				for (var i=0;i<requests.length;i++)
				{
					if (error) break;
					(function(request,update){
						kintone.proxy(
							'https://api.freee.co.jp/api/1/docs',
							'POST',
							{
								'Authorization':'Bearer '+vars.accesstoken,
								'Content-Type':'application/json'
							},
							request,
							function(body,status,headers){
								var json=JSON.parse(body);
								switch (status)
								{
									case 400:
										functions.hideloading();
										var message='不正なリクエストです。';
										for (var i2=0;i2<json.errors.length;i2++)
										{
											var error=json.errors[i2];
											if ($.inArray('Doc referenceが重複しています',error.messages)>-1)
												message=vars.fieldinfos[vars.config['doc_reference_id']].label+'が重複しています。';
										}
										swal('Error!',message,'error');
										error=true;
										break;
									case 401:
										functions.hideloading();
										swal('Error!','サーバーへのアクセスが拒否されました。','error');
										error=true;
										break;
									case 500:
										functions.hideloading();
										swal('Error!','サーバー内で障害が発生しています。','error');
										error=true;
										break;
									default:
										update.record[vars.config['doc_url']].value='https://secure.freee.co.jp/docs_v2/invoice/'+json.doc.id+'/edit';
										kintone.api(kintone.api.url('/k/v1/record',true),'PUT',update,function(resp){
											counter--;
											if (counter==0)
											{
												functions.hideloading();
												swal({
													title:'登録完了',
													text:'Freeeへの登録が完了しました。',
													type:'info',
													showCancelButton:false
												},
												function(){
													location.reload(true);
												});
											}
										},function(error){
											functions.hideloading();
											swal('Error!',error.message,'error');
											error=true;
										});
										break;
								}
							},
							function(error){
								functions.hideloading();
								swal('Error!','Freeeへの接続に失敗しました。','error');
								error=true;
							}
						);
					})(requests[i],updates[i]);
				}
			};
			functions.showloading();
			switch (type)
			{
				case 'list':
					var values=[];
					var updates=[];
					vars.offset=0;
					vars.records=[];
					functions.loaddatas(function(){
						if (vars.records.length==0)
						{
							functions.hideloading();
							setTimeout(function(){
								swal('Error!','レコードがありません。','error');
							},500);
							return;
						}
						for (var i=0;i<vars.records.length;i++)
						{
							var update={
								app:kintone.app.getId(),
								id:vars.records[i]['$id'].value,
								record:{}
							};
							update.record[vars.config['doc_url']]={value:''};
							update.record[vars.config['doc_status']]={value:'下書き'};
							request=functions.createrequest(vars.records[i]);
							if (request)
							{
								values.push(request);
								updates.push(update);
							}
						}
						if (values.length!=0) register(values,updates);
						else
						{
							functions.hideloading();
							setTimeout(function(){
								swal('Error!','登録可能なレコードが見つかりませんでした。','error');
							},500);
						}
					});
					break;
				case 'show':
					var record=kintone.app.record.get().record;
					var update={
						app:kintone.app.getId(),
						id:record['$id'].value,
						record:{}
					};
					update.record[vars.config['doc_url']]={value:''};
					update.record[vars.config['doc_status']]={value:'下書き'};
					request=functions.createrequest(record);
					if (request) register([request],[update]);
					else
					{
						functions.hideloading();
						setTimeout(function(){
							swal('Error!','登録可能なレコードではありません。','error');
						},500);
					}
					break;
			}
		},
		/* sync */
		syncfreee:function(type){
			var request={};
			var register=function(updates){
				var error=false;
				var counter=updates.length;
				for (var i=0;i<updates.length;i++)
				{
					if (error) break;
					kintone.api(kintone.api.url('/k/v1/record',true),'PUT',updates[i],function(resp){
						counter--;
						if (counter==0)
						{
							functions.hideloading();
							swal({
								title:'同期完了',
								text:'発行ステータスの同期が完了しました。',
								type:'info',
								showCancelButton:false
							},
							function(){
								location.reload(true);
							});
						}
					},function(error){
						functions.hideloading();
						swal('Error!',error.message,'error');
						error=true;
					});
				}
			};
			functions.showloading();
			var values=[];
			var updates=[];
			vars.offset=0;
			vars.documents=[];
			functions.loaddocs(function(){
				if (vars.documents.length==0)
				{
					functions.hideloading();
					setTimeout(function(){
						swal('Error!','書類がありません。','error');
					},500);
					return;
				}
				vars.offset=0;
				vars.records=[];
				functions.loaddatas(function(){
					if (vars.records.length==0)
					{
						functions.hideloading();
						setTimeout(function(){
							swal('Error!','レコードがありません。','error');
						},500);
						return;
					}
					for (var i=0;i<vars.records.length;i++)
					{
						var filter=$.grep(vars.documents,function(item,index){
							return item['doc_reference_id']==vars.records[i][vars.config['doc_reference_id']].value;
						});
						if (filter.length!=0)
						{
							var update={
								app:kintone.app.getId(),
								id:vars.records[i]['$id'].value,
								record:{}
							};
							update.record[vars.config['doc_status']]={value:filter[0]['status_name']};
							updates.push(update);
						}
					}
					if (updates.length!=0) register(updates);
					else
					{
						functions.hideloading();
						setTimeout(function(){
							swal('Error!','登録可能なレコードが見つかりませんでした。','error');
						},500);
					}
				});
			});
		},
		/* switch view of loading */
		showloading:function(){
			if (!$('div#loading').size()) $('body').append($('<div id="loading">'));
			$('div#loading').show();
		},
		hideloading:function(){
			$('div#loading').hide();
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
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
					functions.gettoken('list',function(){
						functions.getcompanies('list');
					});
				}
				else swal('Error!','ライセンス認証に失敗しました。','error');
			},
			function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
		);
		return event;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
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
					functions.gettoken('show',function(){
						functions.getcompanies('show');
					});
				}
				else swal('Error!','ライセンス認証に失敗しました。','error');
			},
			function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
		);
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
