// author: InMon Corp.
// version: 0.3
// date: 10/26/2021
// description: Sunburst display of flows
// copyright: Copyright (c) 2021 InMon Corp. ALL RIGHTS RESERVED

var aggMode  = getSystemProperty('sunburst.aggMode')  || 'sum';
var maxFlows = getSystemProperty('sunburst.maxFlows') || 100;
var minValue = getSystemProperty('sunburst.minValue') || 0.01;
var agents   = getSystemProperty('sunburst.agents')   || 'ALL';
var t        = getSystemProperty('sunburst.t')        || 5;
var n        = getSystemProperty('sunburst.n')        || 20;
var value    = getSystemProperty('sunburst.value')    || 'frames';

setFlow('sunburst-stack', {keys:'stack,null:ethernetprotocol:0,null:ipprotocol:0,null:ip6nexthdr:0,null:tcpsourceport:0,null:tcpdestinationport:0,null:udpsourceport:0,null:udpdestinationport:0',value:value,t:t,n:n});

function getData() {
  var tree = {depth:0,value:0,label:'Protocols'};
  var top = activeFlows(agents,'sunburst-stack',maxFlows,minValue,aggMode);
  top.forEach(function(el) {
    let node = tree;
    let val = el.value;
    let [stack,ethernetprotocol,ipprotocol,ip6nexthdr,tcpsourceport,tcpdestinationport,udpsourceport,udpdestinationport] = el.key.split(',');
    let protos = stack.split('.');
    tree.value += val;
    if(protos.length > tree.depth) tree.depth = protos.length;
    protos.forEach(function(proto) {
      if(!node.children) node.children = {};
      let child = node.children[proto];
      if(!child) {
        child = {value:val};
        node.children[proto] = child;
      } else {
        child.value += val;
      }
      node = child;
    });
    let port = 0;
    switch(protos[protos.length - 1]) {
      case 'eth':
        port = parseInt(ethernetprotocol);
        break;
      case 'ip':
        port = parseInt(ipprotocol);
        break;
      case 'ip6':
        port = parseInt(ip6nexthdr);
        break;
      case 'tcp':
        port = Math.min(parseInt(tcpsourceport),parseInt(tcpdestinationport));
        break;
      case 'udp':
        port = Math.min(parseInt(udpsourceport),parseInt(udpdestinationport));
        break;
    }
    if(port > 0) {
      if(protos.length + 1 > tree.depth) tree.depth = protos.length + 1;
      let proto = port.toString();
      if(!node.children) node.children = {};
      let child = node.children[proto];
      if(!child) {
        child = {value:val};
        node.children[proto] = child;
      } else {
        child.value += val;
      }
    }
  });
  return tree;
};

setHttpHandler(function(req) {
  return getData();
});

