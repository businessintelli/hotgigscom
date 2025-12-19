        {/* Review Modal with Wizard Fields */}
        {showResumeReviewModal && parsedResumeData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Review & Complete Your Resume Profile
                </CardTitle>
                <CardDescription>
                  AI has extracted information from your resume. Please review, edit if needed, and fill in additional details before saving.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information - Read Only Display */}
                {parsedResumeData.personalInfo && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Personal Information (Extracted)</h3>
                    <div className="grid grid-cols-2 gap-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      {parsedResumeData.personalInfo.name && (
                        <div>
                          <Label className="text-xs text-gray-600">Name</Label>
                          <p className="font-medium">{parsedResumeData.personalInfo.name}</p>
                        </div>
                      )}
                      {parsedResumeData.personalInfo.email && (
                        <div>
                          <Label className="text-xs text-gray-600">Email</Label>
                          <p className="font-medium">{parsedResumeData.personalInfo.email}</p>
                        </div>
                      )}
                      {parsedResumeData.personalInfo.phone && (
                        <div>
                          <Label className="text-xs text-gray-600">Phone</Label>
                          <p className="font-medium">{parsedResumeData.personalInfo.phone}</p>
                        </div>
                      )}
                      {parsedResumeData.personalInfo.location && (
                        <div>
                          <Label className="text-xs text-gray-600">Location</Label>
                          <p className="font-medium">{parsedResumeData.personalInfo.location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Details - Editable Wizard Fields */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Additional Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="residenceZip">Residence ZIP Code</Label>
                      <Input
                        id="residenceZip"
                        value={residenceZip}
                        onChange={(e) => setResidenceZip(e.target.value)}
                        placeholder="e.g., 94105"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
                      <Input
                        id="linkedinUrl"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non-binary">Non-binary</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="workAuthorization">Work Authorization</Label>
                      <select
                        id="workAuthorization"
                        value={workAuthorization}
                        onChange={(e) => setWorkAuthorization(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select...</option>
                        <option value="us-citizen">US Citizen</option>
                        <option value="green-card">Green Card Holder</option>
                        <option value="h1b">H1B Visa</option>
                        <option value="opt">OPT</option>
                        <option value="cpt">CPT</option>
                        <option value="need-sponsorship">Need Sponsorship</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="salaryExpectation">Salary Expectation (Annual USD)</Label>
                      <Input
                        id="salaryExpectation"
                        type="number"
                        value={salaryExpectation}
                        onChange={(e) => setSalaryExpectation(e.target.value)}
                        placeholder="e.g., 120000"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="noticePeriod">Notice Period</Label>
                      <select
                        id="noticePeriod"
                        value={noticePeriod}
                        onChange={(e) => setNoticePeriod(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select...</option>
                        <option value="immediate">Immediate</option>
                        <option value="2-weeks">2 Weeks</option>
                        <option value="1-month">1 Month</option>
                        <option value="2-months">2 Months</option>
                        <option value="3-months">3 Months</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="willingToRelocate"
                        checked={willingToRelocate}
                        onChange={(e) => setWillingToRelocate(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="willingToRelocate" className="font-normal">
                        Willing to relocate
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Skills Summary */}
                {parsedResumeData.skills && parsedResumeData.skills.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Skills Extracted</h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedResumeData.skills.slice(0, 20).map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))}
                      {parsedResumeData.skills.length > 20 && (
                        <Badge variant="outline">+{parsedResumeData.skills.length - 20} more</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Experience Summary */}
                {parsedResumeData.experience && parsedResumeData.experience.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Experience Extracted</h3>
                    <div className="space-y-2">
                      {parsedResumeData.experience.slice(0, 3).map((exp: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <p className="font-medium text-sm">{exp.title} at {exp.company}</p>
                          {exp.duration && <p className="text-xs text-gray-600">{exp.duration}</p>}
                        </div>
                      ))}
                      {parsedResumeData.experience.length > 3 && (
                        <p className="text-sm text-gray-600">+{parsedResumeData.experience.length - 3} more positions</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Education Summary */}
                {parsedResumeData.education && parsedResumeData.education.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Education Extracted</h3>
                    <div className="space-y-2">
                      {parsedResumeData.education.map((edu: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <p className="font-medium text-sm">{edu.degree}</p>
                          <p className="text-sm text-gray-600">{edu.institution}</p>
                          {edu.year && <p className="text-xs text-gray-600">{edu.year}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowResumeReviewModal(false);
                      setParsedResumeData(null);
                      setResumeUrl('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmResume}
                    disabled={saveResumeAfterReviewMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saveResumeAfterReviewMutation.isPending ? 'Saving...' : 'Save Resume Profile'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
