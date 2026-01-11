import React from 'react';

const steps = [
    { num: '01', title: 'Detection', desc: 'Satellite & IoT sensors detect anomalies.' },
    { num: '02', title: 'Analysis', desc: 'AI assesses severity and risk factors.' },
    { num: '03', title: 'Allocation', desc: 'Resources matched to needs instantly.' },
    { num: '04', title: 'Response', desc: 'Unified command dispatches assets.' },
];

const WorkflowSection: React.FC = () => {
    return (
        <div className="py-24 bg-black text-white relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="w-full md:w-1/3">
                        <h2 className="text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                            Operational<br />Sequence
                        </h2>
                        <p className="text-gray-400 text-lg">
                            From detection to resolution, AetherX automates the critical path of emergency response.
                        </p>
                    </div>

                    <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {steps.map((step, i) => (
                            <div key={i} className="relative p-6 border-l-2 border-gray-800 hover:border-blue-500 transition-colors pl-8">
                                <span className="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-gray-900 border-2 border-gray-600 group-hover:border-blue-500" />
                                <span className="text-6xl font-black text-gray-800 absolute top-2 right-4 select-none opacity-50">{step.num}</span>
                                <h3 className="text-2xl font-bold mb-2 relative z-10">{step.title}</h3>
                                <p className="text-gray-400 relative z-10">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkflowSection;
