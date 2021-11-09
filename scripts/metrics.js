// author: InMon Corp.
// version: 0.7
// date: 11/09/2021
// description: Sunburst display of flows
// copyright: Copyright (c) 2021 InMon Corp. ALL RIGHTS RESERVED

var aggMode  = getSystemProperty('sunburst.aggMode')  || 'sum';
var maxFlows = getSystemProperty('sunburst.maxFlows') || 100;
var minValue = getSystemProperty('sunburst.minValue') || 1;
var agents   = getSystemProperty('sunburst.agents')   || 'ALL';
var t        = getSystemProperty('sunburst.t')        || 5;
var n        = getSystemProperty('sunburst.n')        || 20;
var value    = getSystemProperty('sunburst.value')    || 'frames';

function setProtocolFlows() {
  setFlow('sunburst-stack', {
    keys:[
      'stack',
      'null:ethernetprotocol:0',
      'null:ipprotocol:0',
      'null:ip6nexthdr:0',
      'null:tcpsourceport:0',
      'null:tcpdestinationport:0',
      'null:udpsourceport:0',
      'null:udpdestinationport:0'
    ],
    value:value,
    t:t,
    n:n
  });
}

function clearProtocolFlows() {
  clearFlow('sunburst-stack');
}

function getProtocolData() {
  var tree = {depth:0,value:0,label:'Protocols',flow:true,description:'Network traffic (frames per second) broken out by protocol stack'};
  var top = activeFlows(agents,'sunburst-stack',maxFlows,minValue,aggMode);
  top.forEach(function(el) {
    let node = tree;
    let val = el.value;
    let [stack,ethernetprotocol,ipprotocol,ip6nexthdr,tcpsourceport,tcpdestinationport,udpsourceport,udpdestinationport] = el.key.split(',');
    let protos = stack.split('.');
    tree.value += val;
    if(protos.length > tree.depth) tree.depth = protos.length;
    protos.forEach(function(proto,i) {
      if(!node.children) node.children = {};
      let child = node.children[proto];
      if(!child) {
        child = {value:val};
        node.children[proto] = child;
      } else {
        child.value += val;
      }
      child.id=protos.slice(0,i+1).join('.');
      child.filter = 'prefix:stack:.:'+(i+1)+'='+child.id;
      node = child;
    });
    let port = 0;
    let filter;
    switch(protos[protos.length - 1]) {
      case 'eth':
        port = parseInt(ethernetprotocol);
        filter = 'ethernetprotocol='+port;
        break;
      case 'ip':
        port = parseInt(ipprotocol);
        filter = 'ipprotocol='+port;
        break;
      case 'ip6':
        port = parseInt(ip6nexthdr);
        filter = 'ip6nexthdr='+port;
        break;
      case 'tcp':
        port = Math.min(parseInt(tcpsourceport),parseInt(tcpdestinationport));
        filter = '(tcpsourceport='+port+'|tcpdestinationport='+port+')';
        break;
      case 'udp':
        port = Math.min(parseInt(udpsourceport),parseInt(udpdestinationport));
        filter = '(udpsourceport='+port+'|udpdestinationport='+port+')';
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
      child.filter=node.filter + '&' + filter;
      child.id=node.id + '.' + proto;
    }
  });
  return tree;
};

function setDnsFlows() {
  setFlow('sunburst-dns-src', {
    keys: 'if:[first:stack:.:ip:ip6]:ip:[dns:ipsource]:[dns:ip6source]',
    value:value,
    t:t,
    n:n
  });

  setFlow('sunburst-dns-dst', {
    keys: 'if:[first:stack:.:ip:ip6]:ip:[dns:ipdestination]:[dns:ip6destination]',
    value:value,
    t:t,
    n:n
  });
}

function clearDnsFlows() {
  clearFlow('sunburst-dns-src');
  clearFlow('sunburst-dns-dst');
}

function getDnsData() {
  var tree = {depth:0,value:0,label:'DNS',flow:true,description:'Network traffic (frames per second) broken out by reverse DNS lookup of source/destination addresses'};
  var top = activeFlows(agents,'sunburst-dns-src',maxFlows,minValue,aggMode)
    .concat(activeFlows(agents,'sunburst-dns-dst',maxFlows,minValue,aggMode));
  top.forEach(function(el) {
    let node = tree;
    let val = el.value;
    let doms = el.key.split('.');
    tree.value += val;
    if(doms.length - 1 > tree.depth) tree.depth = doms.length - 1;
    for(let i = doms.length - 2; i >= 0; i--) {
      if(!node.children) node.children = {};
      let dom = doms[i];
      let child = node.children[dom];
      if(!child) {
        child = {value:val};
        node.children[dom] = child;
      } else {
        child.value += val;
      }
      child.id=doms.slice(i).join('.');
      child.filter = 'suffix:[if:[first:stack:.:ip:ip6]:ip:[dns:ipsource]:[dns:ip6source]]:.:'+(doms.length - i)+'='+child.id;
      child.filter += '|suffix:[if:[first:stack:.:ip:ip6]:ip:[dns:ipdestination]:[dns:ip6destination]]:.:'+(doms.length - i)+'='+child.id;
      node = child;
    }
  });
  return tree;
}

function setProcessFlows() { }

function clearProcessFlows() { }

function updateProcessTree(tree,path,val) {
  tree.value += val;
  tree.depth = Math.max(tree.depth,path.length);
  var node = tree;
  var nodes = [];
  path.forEach(function(layer,i) {
    if(!node.children) node.children = {};
    let child = node.children[layer];
    if(!child) {
      child = {value:val};
      node.children[layer] = child;
    } else {
      child.value += val;
    }
    child.id = path.slice(0,i+1).join('.');
    nodes.push(child);
    node = child;
  });
  return nodes;
}

function getProcessData() {
  var tree = {depth:0,value:0,label:'Process',flow:false,description:'Cluster wide CPU time broken out by service'};
  var cols = [
    'sort:vir_cpu_utilization:-1000',
    'null:k8s_namespace',
    'null:k8s_name',
    'null:systemd_service',
    'null:swarm_name',
    'null:jvm_name',
    'null:vir_host_name'
  ];
  var top = table('ALL',cols);
  top.forEach(function(row) {
    let val = row[0].metricValue;
    if(row[1]) updateProcessTree(tree,['k8s',row[1].metricValue,row[2].metricValue],val);
    else if(row[3]) updateProcessTree(tree,['systemd',row[3].metricValue],val);
    else if(row[4]) updateProcessTree(tree,['swarm',row[4].metricValue],val);
    else if(row[5]) updateProcessTree(tree,['jvm',row[6].metricValue],val);
    else if(row[6]) updateProcessTree(tree,['vm',row[6].metricValue],val);
  });
  return tree;
}

var queries = {
  protocols: {
    setFlows: setProtocolFlows,
    clearFlows: clearProtocolFlows,
    getData: getProtocolData,
    flowsDefined: false,
    lastQuery: 0
  },
  dns: {
    setFlows: setDnsFlows,
    clearFlows: clearDnsFlows,
    getData: getDnsData,
    flowsDefined: false,
    lastQuery: 0
  },
  process: {
    setFlows: setProcessFlows,
    clearFlows: clearProcessFlows,
    getData: getProcessData,
    flowsDefined: false,
    lastQuery: 0
  }
};

setIntervalHandler(function(now) {
  for(var name in queries) {
    let query = queries[name];
    if(query.flowsDefined && (now - query.lastQuery) > 60000) {
      query.clearFlows();
      query.flowsDefined = false;
    }
  }
});

setHttpHandler(function(req) {
  if(!req.path || req.path.length != 1) throw 'not_found';
  var result;
  var query = queries[req.path[0]];
  if(!query) throw 'not_found';

  if(!query.flowsDefined) {
    query.setFlows();
    query.flowsDefined = true;
  }
  query.lastQuery = Date.now();

  return query.getData();
});

